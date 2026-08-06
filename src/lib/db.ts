import postgres from "postgres";

let sqlClient: ReturnType<typeof postgres> | null = null;

function getSql() {
  if (!sqlClient) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Add a Postgres connection string (e.g. from Supabase or Neon) to your environment variables.",
      );
    }
    sqlClient = postgres(connectionString, {
      ssl: "require",
      // Required when connecting through a pooler in transaction mode (e.g.
      // Supabase's pooled connection string on port 6543). Harmless otherwise.
      prepare: false,
    });
  }
  return sqlClient;
}

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        property_id TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        stripe_session_id TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS daily_prices (
        id SERIAL PRIMARY KEY,
        property_id TEXT NOT NULL,
        date DATE NOT NULL,
        price INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (property_id, date)
      )
    `.then(() => undefined);
  }
  return schemaReady;
}

export interface BookedRange {
  start_date: string;
  end_date: string;
}

// Confirmed bookings block dates permanently. Pending bookings (a checkout
// session was created but not yet paid) hold the dates for 30 minutes so two
// guests can't pay for the same nights at once, then expire automatically.

export async function getBookedRanges(propertyId: string): Promise<BookedRange[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT start_date, end_date FROM bookings
    WHERE property_id = ${propertyId}
      AND (status = 'confirmed' OR (status = 'pending' AND created_at > now() - interval '30 minutes'))
    ORDER BY start_date ASC
  `;
  return rows as unknown as BookedRange[];
}

export async function hasOverlap(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<boolean> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id FROM bookings
    WHERE property_id = ${propertyId}
      AND (status = 'confirmed' OR (status = 'pending' AND created_at > now() - interval '30 minutes'))
      AND start_date < ${endDate}
      AND end_date > ${startDate}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function createPendingBooking(params: {
  propertyId: string;
  startDate: string;
  endDate: string;
  guestName: string;
  guestEmail: string;
}): Promise<number> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO bookings (property_id, start_date, end_date, guest_name, guest_email, status)
    VALUES (${params.propertyId}, ${params.startDate}, ${params.endDate}, ${params.guestName}, ${params.guestEmail}, 'pending')
    RETURNING id
  `;
  return (rows[0] as { id: number }).id;
}

export async function attachStripeSession(bookingId: number, stripeSessionId: string) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE bookings SET stripe_session_id = ${stripeSessionId} WHERE id = ${bookingId}
  `;
}

export async function confirmBookingBySessionId(stripeSessionId: string) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE bookings SET status = 'confirmed' WHERE stripe_session_id = ${stripeSessionId}
  `;
}

export interface DailyPrice {
  date: string;
  price: number;
}

export async function getPricesForRange(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<DailyPrice[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT date, price FROM daily_prices
    WHERE property_id = ${propertyId}
      AND date >= ${startDate}
      AND date < ${endDate}
    ORDER BY date ASC
  `;
  return rows as unknown as DailyPrice[];
}

export async function calculateTotal(
  propertyId: string,
  startDate: string,
  endDate: string,
  defaultPrice: number,
): Promise<{ total: number; breakdown: { date: string; price: number }[] }> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const prices = await getPricesForRange(propertyId, startDate, endDate);
  const priceMap = new Map(prices.map((p) => [p.date, p.price]));

  const breakdown: { date: string; price: number }[] = [];
  let total = 0;

  const cursor = new Date(start);
  for (let i = 0; i < nights; i++) {
    const date = cursor.toISOString().split("T")[0];
    const price = priceMap.get(date) ?? defaultPrice;
    breakdown.push({ date, price });
    total += price;
    cursor.setDate(cursor.getDate() + 1);
  }

  return { total, breakdown };
}

export async function setPricesForRange(
  propertyId: string,
  startDate: string,
  endDate: string,
  price: number,
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const dates: string[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < nights; i++) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const date of dates) {
    await sql`
      INSERT INTO daily_prices (property_id, date, price)
      VALUES (${propertyId}, ${date}, ${price})
      ON CONFLICT (property_id, date) DO UPDATE SET price = ${price}, updated_at = now()
    `;
  }
}

export async function deletePricesForRange(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    DELETE FROM daily_prices
    WHERE property_id = ${propertyId}
      AND date >= ${startDate}
      AND date < ${endDate}
  `;
}
