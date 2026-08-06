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
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          property_id TEXT NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          guest_name TEXT,
          guest_email TEXT,
          first_name TEXT,
          last_name TEXT,
          email TEXT,
          phone TEXT,
          total_guests INTEGER,
          children_ages TEXT,
          check_in_time TEXT,
          check_out_time TEXT,
          special_requests TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          stripe_session_id TEXT UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      await sql`
        ALTER TABLE bookings
          ADD COLUMN IF NOT EXISTS guest_name TEXT,
          ADD COLUMN IF NOT EXISTS guest_email TEXT,
          ADD COLUMN IF NOT EXISTS first_name TEXT,
          ADD COLUMN IF NOT EXISTS last_name TEXT,
          ADD COLUMN IF NOT EXISTS email TEXT,
          ADD COLUMN IF NOT EXISTS phone TEXT,
          ADD COLUMN IF NOT EXISTS total_guests INTEGER,
          ADD COLUMN IF NOT EXISTS children_ages TEXT,
          ADD COLUMN IF NOT EXISTS check_in_time TEXT,
          ADD COLUMN IF NOT EXISTS check_out_time TEXT,
          ADD COLUMN IF NOT EXISTS special_requests TEXT
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS daily_prices (
          id SERIAL PRIMARY KEY,
          property_id TEXT NOT NULL,
          date DATE NOT NULL,
          price INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (property_id, date)
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS unavailable (
          id SERIAL PRIMARY KEY,
          property_id TEXT NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          reason TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })();
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
  const bookingRows = (await sql`
    SELECT start_date, end_date FROM bookings
    WHERE property_id = ${propertyId}
      AND (status = 'confirmed' OR (status = 'pending' AND created_at > now() - interval '30 minutes'))
  `) as unknown as BookedRange[];
  const unavailableRows = (await sql`
    SELECT start_date, end_date FROM unavailable WHERE property_id = ${propertyId}
  `) as unknown as BookedRange[];
  return [...bookingRows, ...unavailableRows].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );
}

async function hasOverlapQuery(
  sql: ReturnType<typeof getSql>,
  propertyId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: number,
) {
  const bookingRows = excludeBookingId
    ? await sql`
        SELECT id FROM bookings
        WHERE property_id = ${propertyId}
          AND id != ${excludeBookingId}
          AND (status = 'confirmed' OR (status = 'pending' AND created_at > now() - interval '30 minutes'))
          AND start_date < ${endDate}
          AND end_date > ${startDate}
        LIMIT 1
      `
    : await sql`
        SELECT id FROM bookings
        WHERE property_id = ${propertyId}
          AND (status = 'confirmed' OR (status = 'pending' AND created_at > now() - interval '30 minutes'))
          AND start_date < ${endDate}
          AND end_date > ${startDate}
        LIMIT 1
      `;
  if (bookingRows.length > 0) return true;
  const unavailableRows = await sql`
    SELECT id FROM unavailable
    WHERE property_id = ${propertyId}
      AND start_date < ${endDate}
      AND end_date > ${startDate}
    LIMIT 1
  `;
  return unavailableRows.length > 0;
}

export async function hasOverlap(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<boolean> {
  await ensureSchema();
  const sql = getSql();
  return hasOverlapQuery(sql, propertyId, startDate, endDate);
}

export async function hasOverlapExcluding(
  propertyId: string,
  startDate: string,
  endDate: string,
  excludeBookingId: number,
): Promise<boolean> {
  await ensureSchema();
  const sql = getSql();
  return hasOverlapQuery(sql, propertyId, startDate, endDate, excludeBookingId);
}

export async function createPendingBooking(params: {
  propertyId: string;
  startDate: string;
  endDate: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalGuests: number;
  childrenAges?: string;
  checkInTime?: string;
  checkOutTime?: string;
  specialRequests?: string;
}): Promise<number> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO bookings (
      property_id,
      start_date,
      end_date,
      first_name,
      last_name,
      email,
      phone,
      total_guests,
      children_ages,
      check_in_time,
      check_out_time,
      special_requests,
      status
    )
    VALUES (
      ${params.propertyId},
      ${params.startDate},
      ${params.endDate},
      ${params.firstName},
      ${params.lastName},
      ${params.email},
      ${params.phone},
      ${params.totalGuests},
      ${params.childrenAges ?? null},
      ${params.checkInTime ?? null},
      ${params.checkOutTime ?? null},
      ${params.specialRequests ?? null},
      'pending'
    )
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

export interface BlockedRange {
  id: number;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}

export async function getBlockedRanges(propertyId: string): Promise<BlockedRange[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, property_id, start_date, end_date, reason
    FROM unavailable
    WHERE property_id = ${propertyId}
    ORDER BY start_date DESC
  `;
  return rows as unknown as BlockedRange[];
}

export async function createBlockedRange(params: {
  propertyId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO unavailable (property_id, start_date, end_date, reason)
    VALUES (${params.propertyId}, ${params.startDate}, ${params.endDate}, ${params.reason ?? null})
  `;
}

export async function deleteBlockedRange(id: number): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM unavailable WHERE id = ${id}`;
}

export interface BookingRow {
  id: number;
  property_id: string;
  start_date: string;
  end_date: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  total_guests: number | null;
  children_ages: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  special_requests: string | null;
  status: string;
  created_at: string;
}

export async function getAllBookings(): Promise<BookingRow[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT
      id,
      property_id,
      start_date,
      end_date,
      first_name,
      last_name,
      email,
      phone,
      total_guests,
      children_ages,
      check_in_time,
      check_out_time,
      special_requests,
      status,
      created_at
    FROM bookings
    ORDER BY start_date DESC
  `;
  return rows as unknown as BookingRow[];
}

export async function updateBooking(
  id: number,
  fields: Partial<BookingRow>,
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT id, property_id FROM bookings WHERE id = ${id}`;
  if (rows.length === 0) {
    throw new Error("Booking not found.");
  }

  const existing = rows[0] as { id: number; property_id: string };
  const propertyId = fields.property_id ?? existing.property_id;
  const startDate = fields.start_date ?? null;
  const endDate = fields.end_date ?? null;
  const firstName = fields.first_name ?? null;
  const lastName = fields.last_name ?? null;
  const email = fields.email ?? null;
  const phone = fields.phone ?? null;
  const totalGuests = fields.total_guests ?? null;
  const childrenAges = fields.children_ages ?? null;
  const checkInTime = fields.check_in_time ?? null;
  const checkOutTime = fields.check_out_time ?? null;
  const specialRequests = fields.special_requests ?? null;
  const status = fields.status ?? null;

  if (startDate && endDate) {
    if (new Date(startDate) >= new Date(endDate)) {
      throw new Error("Check-out must be after check-in.");
    }
    if (await hasOverlapExcluding(propertyId, startDate, endDate, id)) {
      throw new Error("Those dates overlap with another booking or blocked range.");
    }
  }

  await sql`
    UPDATE bookings
    SET
      start_date = COALESCE(${startDate}, start_date),
      end_date = COALESCE(${endDate}, end_date),
      first_name = COALESCE(${firstName}, first_name),
      last_name = COALESCE(${lastName}, last_name),
      email = COALESCE(${email}, email),
      phone = COALESCE(${phone}, phone),
      total_guests = COALESCE(${totalGuests}, total_guests),
      children_ages = COALESCE(${childrenAges}, children_ages),
      check_in_time = COALESCE(${checkInTime}, check_in_time),
      check_out_time = COALESCE(${checkOutTime}, check_out_time),
      special_requests = COALESCE(${specialRequests}, special_requests),
      status = COALESCE(${status}, status)
    WHERE id = ${id}
  `;
}

export async function deleteBooking(id: number): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM bookings WHERE id = ${id}`;
}
