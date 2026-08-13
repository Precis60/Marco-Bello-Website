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

      // property_id is null for costs, jobs and events that cover the whole farm.
      await sql`
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          property_id TEXT,
          date DATE NOT NULL,
          category TEXT NOT NULL,
          vendor TEXT,
          description TEXT,
          amount_cents INTEGER NOT NULL,
          paid BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          property_id TEXT,
          title TEXT NOT NULL,
          details TEXT,
          assignee TEXT,
          due_date DATE,
          priority TEXT NOT NULL DEFAULT 'medium',
          status TEXT NOT NULL DEFAULT 'open',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          completed_at TIMESTAMPTZ
        )
      `;

      await sql`
        ALTER TABLE tasks
          ADD COLUMN IF NOT EXISTS area TEXT,
          ADD COLUMN IF NOT EXISTS work_type TEXT,
          ADD COLUMN IF NOT EXISTS minutes INTEGER,
          ADD COLUMN IF NOT EXISTS created_by TEXT
      `;

      // end_date is the last day of the entry (inclusive), unlike bookings.
      await sql`
        CREATE TABLE IF NOT EXISTS calendar_events (
          id SERIAL PRIMARY KEY,
          property_id TEXT,
          title TEXT NOT NULL,
          kind TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'scheduled',
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          start_time TEXT,
          end_time TEXT,
          contractor TEXT,
          contact TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      // recipient_id is null for messages sent to the whole team channel.
      await sql`
        CREATE TABLE IF NOT EXISTS staff_messages (
          id SERIAL PRIMARY KEY,
          sender_id TEXT NOT NULL,
          recipient_id TEXT,
          body TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          company TEXT,
          position TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          notes TEXT,
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

export async function getBookedRanges(
  propertyId: string,
): Promise<BookedRange[]> {
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
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
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

export async function attachStripeSession(
  bookingId: number,
  stripeSessionId: string,
) {
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
  const nights = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

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
  const nights = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

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

export async function getBlockedRanges(
  propertyId: string,
): Promise<BlockedRange[]> {
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
      throw new Error(
        "Those dates overlap with another booking or blocked range.",
      );
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

export interface ExpenseRow {
  id: number;
  property_id: string | null;
  date: string;
  category: string;
  vendor: string | null;
  description: string | null;
  amount_cents: number;
  paid: boolean;
  created_at: string;
}

export async function getExpenses(): Promise<ExpenseRow[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, property_id, date, category, vendor, description, amount_cents, paid, created_at
    FROM expenses
    ORDER BY date DESC, id DESC
  `;
  return rows as unknown as ExpenseRow[];
}

export async function createExpense(params: {
  propertyId: string | null;
  date: string;
  category: string;
  vendor?: string | null;
  description?: string | null;
  amountCents: number;
  paid: boolean;
}): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO expenses (property_id, date, category, vendor, description, amount_cents, paid)
    VALUES (
      ${params.propertyId},
      ${params.date},
      ${params.category},
      ${params.vendor ?? null},
      ${params.description ?? null},
      ${params.amountCents},
      ${params.paid}
    )
  `;
}

export async function setExpensePaid(id: number, paid: boolean): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`UPDATE expenses SET paid = ${paid} WHERE id = ${id}`;
}

export async function deleteExpense(id: number): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM expenses WHERE id = ${id}`;
}

export interface TaskRow {
  id: number;
  property_id: string | null;
  title: string;
  details: string | null;
  assignee: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  area: string | null;
  work_type: string | null;
  minutes: number | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export async function getTasks(): Promise<TaskRow[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, property_id, title, details, assignee, due_date, priority, status,
           area, work_type, minutes, created_by, created_at, completed_at
    FROM tasks
    ORDER BY due_date ASC NULLS LAST, id DESC
  `;
  return rows as unknown as TaskRow[];
}

export async function createTask(params: {
  propertyId: string | null;
  title: string;
  details?: string | null;
  assignee?: string | null;
  dueDate?: string | null;
  priority: string;
  status?: string;
  area?: string | null;
  workType?: string | null;
  minutes?: number | null;
  createdBy?: string | null;
}): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO tasks (
      property_id, title, details, assignee, due_date, priority, status,
      area, work_type, minutes, created_by
    )
    VALUES (
      ${params.propertyId},
      ${params.title},
      ${params.details ?? null},
      ${params.assignee ?? null},
      ${params.dueDate ?? null},
      ${params.priority},
      ${params.status ?? "open"},
      ${params.area ?? null},
      ${params.workType ?? null},
      ${params.minutes ?? null},
      ${params.createdBy ?? null}
    )
  `;
}

export async function setTaskStatus(id: number, status: string): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  if (status === "done") {
    await sql`UPDATE tasks SET status = ${status}, completed_at = now() WHERE id = ${id}`;
  } else {
    await sql`UPDATE tasks SET status = ${status}, completed_at = NULL WHERE id = ${id}`;
  }
}

export async function deleteTask(id: number): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM tasks WHERE id = ${id}`;
}

export interface CalendarEventRow {
  id: number;
  property_id: string | null;
  title: string;
  kind: string;
  status: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  contractor: string | null;
  contact: string | null;
  notes: string | null;
  created_at: string;
}

export async function getCalendarEvents(): Promise<CalendarEventRow[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, property_id, title, kind, status, start_date, end_date, start_time, end_time,
           contractor, contact, notes, created_at
    FROM calendar_events
    ORDER BY start_date ASC, id ASC
  `;
  return rows as unknown as CalendarEventRow[];
}

export async function createCalendarEvent(params: {
  propertyId: string | null;
  title: string;
  kind: string;
  status: string;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  contractor?: string | null;
  contact?: string | null;
  notes?: string | null;
}): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO calendar_events (
      property_id, title, kind, status, start_date, end_date, start_time, end_time,
      contractor, contact, notes
    )
    VALUES (
      ${params.propertyId},
      ${params.title},
      ${params.kind},
      ${params.status},
      ${params.startDate},
      ${params.endDate},
      ${params.startTime ?? null},
      ${params.endTime ?? null},
      ${params.contractor ?? null},
      ${params.contact ?? null},
      ${params.notes ?? null}
    )
  `;
}

export async function updateCalendarEvent(
  id: number,
  params: {
    propertyId: string | null;
    title: string;
    kind: string;
    status: string;
    startDate: string;
    endDate: string;
    startTime?: string | null;
    endTime?: string | null;
    contractor?: string | null;
    contact?: string | null;
    notes?: string | null;
  },
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE calendar_events SET
      property_id = ${params.propertyId},
      title = ${params.title},
      kind = ${params.kind},
      status = ${params.status},
      start_date = ${params.startDate},
      end_date = ${params.endDate},
      start_time = ${params.startTime ?? null},
      end_time = ${params.endTime ?? null},
      contractor = ${params.contractor ?? null},
      contact = ${params.contact ?? null},
      notes = ${params.notes ?? null}
    WHERE id = ${id}
  `;
}

export async function setCalendarEventStatus(
  id: number,
  status: string,
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`UPDATE calendar_events SET status = ${status} WHERE id = ${id}`;
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM calendar_events WHERE id = ${id}`;
}

export interface ContactRow {
  id: number;
  first_name: string;
  last_name: string;
  company: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

export interface ContactInput {
  firstName: string;
  lastName: string;
  company?: string | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export async function getContacts(): Promise<ContactRow[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT id, first_name, last_name, company, position, email, phone, address, notes
    FROM contacts
    ORDER BY lower(last_name) ASC, lower(first_name) ASC
  `;
  return rows as unknown as ContactRow[];
}

export async function createContact(contact: ContactInput): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO contacts (first_name, last_name, company, position, email, phone, address, notes)
    VALUES (
      ${contact.firstName},
      ${contact.lastName},
      ${contact.company ?? null},
      ${contact.position ?? null},
      ${contact.email ?? null},
      ${contact.phone ?? null},
      ${contact.address ?? null},
      ${contact.notes ?? null}
    )
  `;
}

export async function updateContact(
  id: number,
  contact: ContactInput,
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    UPDATE contacts
    SET first_name = ${contact.firstName},
        last_name = ${contact.lastName},
        company = ${contact.company ?? null},
        position = ${contact.position ?? null},
        email = ${contact.email ?? null},
        phone = ${contact.phone ?? null},
        address = ${contact.address ?? null},
        notes = ${contact.notes ?? null}
    WHERE id = ${id}
  `;
}

export async function deleteContact(id: number): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM contacts WHERE id = ${id}`;
}

export interface StaffMessageRow {
  id: number;
  sender_id: string;
  recipient_id: string | null;
  body: string;
  created_at: string;
}

/**
 * Messages in one conversation: the team channel when `otherId` is null,
 * otherwise the direct thread between `viewerId` and `otherId`.
 */
export async function getStaffMessages(
  viewerId: string,
  otherId: string | null,
): Promise<StaffMessageRow[]> {
  await ensureSchema();
  const sql = getSql();

  const rows = otherId
    ? await sql`
        SELECT id, sender_id, recipient_id, body, created_at
        FROM staff_messages
        WHERE (sender_id = ${viewerId} AND recipient_id = ${otherId})
           OR (sender_id = ${otherId} AND recipient_id = ${viewerId})
        ORDER BY id ASC
      `
    : await sql`
        SELECT id, sender_id, recipient_id, body, created_at
        FROM staff_messages
        WHERE recipient_id IS NULL
        ORDER BY id ASC
      `;

  return rows as unknown as StaffMessageRow[];
}

export async function createStaffMessage(params: {
  senderId: string;
  recipientId: string | null;
  body: string;
}): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO staff_messages (sender_id, recipient_id, body)
    VALUES (${params.senderId}, ${params.recipientId}, ${params.body})
  `;
}

export async function deleteStaffMessage(
  id: number,
  senderId: string,
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM staff_messages WHERE id = ${id} AND sender_id = ${senderId}`;
}
