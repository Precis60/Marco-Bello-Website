import assert from "node:assert/strict";

import { publishedNightRate, quoteStay, STALLA_ID, VILLA_ID } from "../src/lib/rates.ts";

function price(propertyId: string, iso: string) {
  return publishedNightRate(propertyId, iso).price;
}

function min(propertyId: string, iso: string) {
  return publishedNightRate(propertyId, iso).minNights;
}

assert.equal(price(VILLA_ID, "2026-08-03"), 980);
assert.equal(price(VILLA_ID, "2026-08-07"), 1350);
assert.equal(price(VILLA_ID, "2026-08-09"), 980);
assert.equal(price(VILLA_ID, "2026-01-03"), 2300);
assert.equal(price(VILLA_ID, "2026-01-05"), 1950);
assert.equal(price(VILLA_ID, "2026-01-02"), 2900);
assert.equal(price(VILLA_ID, "2026-01-27"), 1350);
assert.equal(price(VILLA_ID, "2026-01-30"), 1850);
assert.equal(price(VILLA_ID, "2026-04-06"), 1450);
assert.equal(price(VILLA_ID, "2026-04-11"), 1800);
assert.equal(price(VILLA_ID, "2026-04-12"), 1150);
assert.equal(price(VILLA_ID, "2026-06-26"), 1500);
assert.equal(price(VILLA_ID, "2026-06-25"), 1000);
assert.equal(price(VILLA_ID, "2026-09-18"), 1600);
assert.equal(price(VILLA_ID, "2026-10-03"), 1600);
assert.equal(price(VILLA_ID, "2026-10-04"), 1200);
assert.equal(price(VILLA_ID, "2026-12-19"), 2200);
assert.equal(price(VILLA_ID, "2026-12-24"), 2600);
assert.equal(price(VILLA_ID, "2026-12-28"), 2900);
assert.equal(price(VILLA_ID, "2027-01-01"), 2900);
assert.equal(price(VILLA_ID, "2026-10-31"), 1900);
assert.equal(price(VILLA_ID, "2026-11-03"), 1900);
assert.equal(price(VILLA_ID, "2026-11-27"), 2100);
assert.equal(price(VILLA_ID, "2027-01-23"), 2400);
assert.equal(min(VILLA_ID, "2027-01-23"), 5);
assert.equal(price(VILLA_ID, "2027-03-25"), 2150);
assert.equal(price(VILLA_ID, "2027-06-13"), 1650);

assert.equal(price(STALLA_ID, "2026-08-03"), 210);
assert.equal(price(STALLA_ID, "2026-08-07"), 260);
assert.equal(price(STALLA_ID, "2026-12-15"), 320);
assert.equal(price(STALLA_ID, "2026-03-10"), 250);
assert.equal(price(STALLA_ID, "2026-12-25"), 420);
assert.equal(price(STALLA_ID, "2026-10-31"), 380);
assert.equal(price(STALLA_ID, "2026-10-30"), 310);
assert.equal(price(STALLA_ID, "2027-01-10"), 320);
assert.equal(min(STALLA_ID, "2027-01-10"), 3);

const winter = quoteStay({
  propertyId: VILLA_ID,
  startDate: "2026-08-03",
  endDate: "2026-08-05",
  guests: 9,
  pets: 1,
});
assert.equal(winter.ok, true);
if (winter.ok) {
  assert.equal(winter.quote.accommodation, 980 * 2);
  assert.equal(winter.quote.cleaning, 340);
  assert.equal(winter.quote.extraGuests, 75 * 2);
  assert.equal(winter.quote.petFee, 120);
  assert.equal(winter.quote.total, 980 * 2 + 340 + 150 + 120);
  assert.equal(winter.quote.levyApplies, true);
}

const christmas = quoteStay({
  propertyId: VILLA_ID,
  startDate: "2026-12-24",
  endDate: "2026-12-26",
  guests: 4,
});
assert.equal(christmas.ok, false);

const saved = quoteStay({
  propertyId: VILLA_ID,
  startDate: "2026-08-03",
  endDate: "2026-08-05",
  guests: 2,
  overrides: { "2026-08-03": 1100 },
});
assert.equal(saved.ok, true);
if (saved.ok) {
  assert.equal(saved.quote.nights[0].price, 1100);
  assert.equal(saved.quote.nights[0].source, "saved");
  assert.equal(saved.quote.nights[1].price, 980);
}

console.log("public rate checks passed");
