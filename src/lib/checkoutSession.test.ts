import assert from "node:assert/strict";
import test from "node:test";

import postgres from "postgres";

import {
  buildCheckoutLineItems,
  checkoutMetadata,
  checkoutRedirectUrls,
  quoteNotes,
  STRIPE_METADATA_VALUE_MAX,
} from "./checkoutSession";
import { insertPendingBooking, legacyGuestFields } from "./db";
import { quoteStay, STAY_POLICIES, VILLA_ID } from "./rates";
import { DEFAULT_PRODUCTION_SITE_URL } from "./site";
import {
  CHECK_IN_SLOTS,
  CHECK_OUT_SLOTS,
  STANDARD_CHECK_IN,
  STANDARD_CHECK_OUT,
} from "./stayTimes";

const databaseUrl = process.env.CHECKOUT_TEST_DATABASE_URL;

test("Villa Di Marco checkout with 9 guests and a pet uses positive integer cents", () => {
  const quoted = quoteStay({
    propertyId: VILLA_ID,
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    guests: 9,
    pets: 1,
  });
  assert.equal(quoted.ok, true);
  if (!quoted.ok) return;

  assert.equal(quoted.quote.extraGuestCount, 1);
  assert.ok(quoted.quote.extraGuests > 0);
  assert.equal(quoted.quote.petCount, 1);

  const policy = STAY_POLICIES[VILLA_ID];
  const lineItems = buildCheckoutLineItems({
    propertyName: "Villa Di Marco",
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    quote: quoted.quote,
    policy,
  });

  assert.equal(lineItems.length, 4);
  const amounts = lineItems.map((item) => item.price_data?.unit_amount);
  assert.deepEqual(amounts, [
    quoted.quote.accommodation * 100,
    quoted.quote.cleaning * 100,
    quoted.quote.extraGuests * 100,
    quoted.quote.petFee * 100,
  ]);
  for (const amount of amounts) {
    assert.equal(typeof amount, "number");
    assert.ok(Number.isInteger(amount));
    assert.ok((amount ?? 0) > 0);
  }
});

test("quote notes stay off Stripe metadata, which must be short strings", () => {
  const quoted = quoteStay({
    propertyId: VILLA_ID,
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    guests: 9,
    pets: 1,
  });
  assert.equal(quoted.ok, true);
  if (!quoted.ok) return;

  const notes = [
    "A".repeat(600),
    quoteNotes(quoted.quote, true, "26", "38"),
  ].join("\n\n");
  assert.ok(notes.length > STRIPE_METADATA_VALUE_MAX);

  const metadata = checkoutMetadata({
    bookingId: 42,
    propertyId: VILLA_ID,
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    totalAud: quoted.quote.total,
  });

  assert.deepEqual(Object.keys(metadata), ["bookingId", "propertyId", "startDate", "endDate", "totalAud"]);
  for (const value of Object.values(metadata)) {
    assert.equal(typeof value, "string");
    if (typeof value !== "string") continue;
    assert.ok(value.length <= STRIPE_METADATA_VALUE_MAX);
    assert.equal(value.includes("Pool temperature"), false);
    assert.equal(value.includes(notes), false);
  }
});

test("checkout redirect URLs are absolute https on the production origin", () => {
  const urls = checkoutRedirectUrls(DEFAULT_PRODUCTION_SITE_URL);
  assert.equal(
    urls.success_url,
    "https://marco-bello-website.vercel.app/booking/success?session_id={CHECKOUT_SESSION_ID}",
  );
  assert.equal(urls.cancel_url, "https://marco-bello-website.vercel.app/booking/cancel");
  assert.doesNotThrow(() => checkoutRedirectUrls("http://localhost:3000"));
  assert.throws(() => checkoutRedirectUrls("http://marco-bello-website.vercel.app"));
  assert.throws(() => checkoutRedirectUrls("/booking/success"));
});

test("requested times are 30-minute slots with standard, early and late labels", () => {
  assert.deepEqual(CHECK_IN_SLOTS[0], { value: "12:00", label: "12:00pm (early · $150)" });
  assert.equal(CHECK_IN_SLOTS.at(-1)?.value, "20:00");
  assert.equal(CHECK_IN_SLOTS.at(-1)?.label, "8:00pm");
  assert.deepEqual(
    CHECK_IN_SLOTS.find((slot) => slot.value === STANDARD_CHECK_IN),
    { value: "14:00", label: "2:00pm (standard)" },
  );
  assert.equal(CHECK_IN_SLOTS.length, 17);
  assert.ok(CHECK_IN_SLOTS.every((slot, index) => index === 0 || slot.value > CHECK_IN_SLOTS[index - 1].value));

  assert.deepEqual(CHECK_OUT_SLOTS[0], { value: "07:00", label: "7:00am" });
  assert.deepEqual(
    CHECK_OUT_SLOTS.find((slot) => slot.value === STANDARD_CHECK_OUT),
    { value: "10:00", label: "10:00am (standard)" },
  );
  assert.deepEqual(
    CHECK_OUT_SLOTS.find((slot) => slot.value === "11:00"),
    { value: "11:00", label: "11:00am (late · $150)" },
  );
  assert.deepEqual(CHECK_OUT_SLOTS.at(-1), { value: "12:00", label: "12:00pm (late · $150)" });
  assert.equal(CHECK_OUT_SLOTS.length, 11);
});

test("legacy guest columns combine the name the original table requires", () => {
  assert.deepEqual(legacyGuestFields("Jamie", "Anderson", "jamie@precisionautomationau.com"), {
    guestName: "Jamie Anderson",
    guestEmail: "jamie@precisionautomationau.com",
  });
});

test("pending insert fills guest_name on the original NOT NULL bookings table", async (t) => {
  if (!databaseUrl) {
    t.skip("CHECKOUT_TEST_DATABASE_URL is not set");
    return;
  }

  const sql = postgres(databaseUrl, { ssl: false, prepare: false, max: 1, onnotice: () => undefined });
  try {
    await sql.unsafe("DROP SCHEMA IF EXISTS checkout_regress CASCADE");
    await sql.unsafe("CREATE SCHEMA checkout_regress");
    await sql.unsafe(`
      CREATE TABLE checkout_regress.bookings (
        id SERIAL PRIMARY KEY,
        property_id TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
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
    `);
    await sql.unsafe("SET search_path TO checkout_regress");

    await assert.rejects(
      sql`
        INSERT INTO bookings (
          property_id, start_date, end_date, first_name, last_name, email, phone, total_guests, status
        ) VALUES (
          'main-house', '2026-11-10', '2026-11-12', 'Jamie', 'Anderson',
          'jamie@precisionautomationau.com', '0413729663', 9, 'pending'
        )
      `,
      (error: { code?: string }) => error.code === "23502",
    );

    const id = await insertPendingBooking(sql, {
      propertyId: VILLA_ID,
      startDate: "2026-11-10",
      endDate: "2026-11-12",
      firstName: "Jamie",
      lastName: "Anderson",
      email: "jamie@precisionautomationau.com",
      phone: "0413729663",
      totalGuests: 9,
      childrenAges: "4, 7",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      specialRequests: "Pool temperature request: 26",
    });

    const rows = await sql<{
      guest_name: string;
      guest_email: string;
      check_in_time: string;
      check_out_time: string;
      total_guests: number;
    }[]>`
      SELECT guest_name, guest_email, check_in_time, check_out_time, total_guests
      FROM bookings WHERE id = ${id}
    `;
    assert.equal(rows[0].guest_name, "Jamie Anderson");
    assert.equal(rows[0].guest_email, "jamie@precisionautomationau.com");
    assert.equal(rows[0].check_in_time, "14:00");
    assert.equal(rows[0].check_out_time, "11:00");
    assert.equal(rows[0].total_guests, 9);
  } finally {
    await sql.unsafe("DROP SCHEMA IF EXISTS checkout_regress CASCADE").catch(() => undefined);
    await sql.end();
  }
});
