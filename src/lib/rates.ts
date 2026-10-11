/**
 * Published public rates for Bello Marco Farm.
 *
 * Admin daily prices, when they exist, replace the nightly figure for that
 * date. These tables are the public fallback and the "from" prices on the
 * website. They do not change the admin fallback stored on each property.
 *
 * Weeknight means Sunday–Thursday. Weekend means Friday and Saturday.
 * Christmas (24–27 Dec) and New Year (28 Dec–2 Jan) repeat each year at the
 * published 2026/27 figures until those dates are revised.
 * Other event rates apply only to the dated 2026/27 periods below.
 */

export const VILLA_ID = "main-house";
export const STALLA_ID = "vineyard-tiny-home";

export const FROM_PRICES = {
  villa: 980,
  stalla: 210,
  estate: 1350,
} as const;

export const LEVY_NOTE =
  "The Victorian 7.5% short stay levy applies to stays under 28 days and is not included in the total.";

export interface StayPolicy {
  id: typeof VILLA_ID | typeof STALLA_ID;
  fromPrice: number;
  cleaning: number;
  includedGuests: number;
  maxGuests: number;
  extraGuestPerNight: number;
  petsAllowed: boolean;
  poolIncluded: boolean;
}

export const STAY_POLICIES: Record<string, StayPolicy> = {
  [VILLA_ID]: {
    id: VILLA_ID,
    fromPrice: FROM_PRICES.villa,
    cleaning: 340,
    includedGuests: 8,
    maxGuests: 10,
    extraGuestPerNight: 75,
    petsAllowed: true,
    poolIncluded: true,
  },
  [STALLA_ID]: {
    id: STALLA_ID,
    fromPrice: FROM_PRICES.stalla,
    cleaning: 130,
    includedGuests: 6,
    maxGuests: 6,
    extraGuestPerNight: 0,
    petsAllowed: false,
    poolIncluded: false,
  },
};

export const ESTATE_CLEANING = 470;
export const PET_FIRST = 120;
export const PET_EXTRA = 60;
export const MAX_PETS = 2;
export const EARLY_LATE_FEE = 150;

export interface NightRate {
  price: number;
  minNights: number;
}

export interface NightQuote {
  date: string;
  price: number;
  source: "published" | "saved";
}

export interface StayQuote {
  nights: NightQuote[];
  nightCount: number;
  accommodation: number;
  cleaning: number;
  extraGuests: number;
  extraGuestCount: number;
  petFee: number;
  petCount: number;
  total: number;
  minNights: number;
  levyApplies: boolean;
}

export type QuoteResult =
  | { ok: true; quote: StayQuote }
  | { ok: false; error: string };

interface DatedRate {
  start: string;
  end: string;
  price: number;
  minNights: number;
}

/** Inclusive civil dates. One-off house events from the 2026/27 rate card. */
const VILLA_EVENTS: DatedRate[] = [
  { start: "2026-10-31", end: "2026-11-03", price: 1900, minNights: 3 },
  { start: "2026-11-27", end: "2026-11-29", price: 2100, minNights: 2 },
  { start: "2027-01-08", end: "2027-01-09", price: 2300, minNights: 4 },
  // January row asks for 5 nights over Australia Day; the event row lists 3.
  { start: "2027-01-23", end: "2027-01-26", price: 2400, minNights: 5 },
  { start: "2027-03-06", end: "2027-03-08", price: 1950, minNights: 3 },
  { start: "2027-03-25", end: "2027-03-29", price: 2150, minNights: 3 },
  { start: "2027-06-12", end: "2027-06-14", price: 1650, minNights: 3 },
];

const UNIT_EVENT_RANGES: { start: string; end: string }[] = [
  { start: "2026-10-31", end: "2026-11-03" },
  { start: "2026-11-27", end: "2026-11-29" },
  { start: "2027-01-23", end: "2027-01-26" },
  { start: "2027-03-06", end: "2027-03-08" },
  { start: "2027-03-25", end: "2027-03-29" },
  { start: "2027-06-12", end: "2027-06-14" },
];

export function parseISODate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Invalid date: ${iso}`);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normaliseDateKey(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function eachNight(startDate: string, endDate: string): string[] {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  const nights: string[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    nights.push(formatISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return nights;
}

function monthDay(iso: string): number {
  const date = parseISODate(iso);
  return (date.getMonth() + 1) * 100 + date.getDate();
}

export function isWeekendNight(iso: string): boolean {
  const day = parseISODate(iso).getDay();
  return day === 5 || day === 6;
}

function inDatedRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

function pickDated(iso: string, rows: DatedRate[]): DatedRate | undefined {
  return rows.find((row) => inDatedRange(iso, row.start, row.end));
}

/** 24 Dec–2 Jan, repeating every year. 2 Jan is included as a night. */
export function isChristmasNewYear(iso: string): boolean {
  const md = monthDay(iso);
  return md >= 1224 || md <= 102;
}

function christmasNewYearVilla(iso: string): NightRate | null {
  const md = monthDay(iso);
  if (md >= 1224 && md <= 1227) return { price: 2600, minNights: 4 };
  if (md >= 1228 || md <= 102) return { price: 2900, minNights: 5 };
  return null;
}

function villaSchoolHoliday(iso: string): NightRate | null {
  const md = monthDay(iso);
  const weekend = isWeekendNight(iso);
  if (md >= 401 && md <= 411) {
    return { price: weekend ? 1800 : 1450, minNights: 3 };
  }
  if (md >= 626 && md <= 630) {
    return { price: weekend ? 1500 : 1150, minNights: 2 };
  }
  if ((md >= 918 && md <= 930) || (md >= 1001 && md <= 1003)) {
    return { price: weekend ? 1600 : 1200, minNights: 2 };
  }
  return null;
}

function villaMonth(iso: string): NightRate {
  const date = parseISODate(iso);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekend = isWeekendNight(iso);
  const rate = (weekday: number, fridaySaturday: number, minNights: number): NightRate => ({
    price: weekend ? fridaySaturday : weekday,
    minNights,
  });

  if (month === 1 && day <= 26) return rate(1950, 2300, 4);
  if (month === 1) return rate(1350, 1850, 2);
  if (month === 2) return rate(1300, 1800, 2);
  if (month === 3) return rate(1200, 1750, 2);
  if (month === 4) return rate(1150, 1650, 2);
  if (month === 5) return rate(1050, 1450, 2);
  if (month === 6 || month === 7) return rate(1000, 1400, 2);
  if (month === 8) return rate(980, 1350, 2);
  if (month === 9) return rate(1100, 1500, 2);
  if (month === 10) return rate(1200, 1650, 2);
  if (month === 11) return rate(1250, 1800, 2);
  if (day <= 18) return rate(1350, 1900, 2);
  if (day <= 23) return rate(1850, 2200, 4);
  return { price: 2600, minNights: 4 };
}

export function publishedNightRate(propertyId: string, iso: string): NightRate {
  if (propertyId === VILLA_ID) {
    const event = pickDated(iso, VILLA_EVENTS);
    if (event) return { price: event.price, minNights: event.minNights };
    return christmasNewYearVilla(iso) ?? villaSchoolHoliday(iso) ?? villaMonth(iso);
  }

  if (propertyId === STALLA_ID) {
    if (isChristmasNewYear(iso)) return { price: 420, minNights: 4 };
    const weekend = isWeekendNight(iso);
    const season = stallaSeason(iso);
    const premium = UNIT_EVENT_RANGES.some((row) => inDatedRange(iso, row.start, row.end));
    if (premium) {
      return {
        price: weekend ? 380 : 340,
        minNights: Math.max(2, season.minNights),
      };
    }
    return season;
  }

  throw new Error(`No published rates for ${propertyId}`);
}

function stallaSeason(iso: string): NightRate {
  const month = parseISODate(iso).getMonth() + 1;
  const weekend = isWeekendNight(iso);
  if (month >= 5 && month <= 9) {
    return { price: weekend ? 260 : 210, minNights: 2 };
  }
  if (month === 3 || month === 4 || month === 10 || month === 11) {
    return { price: weekend ? 310 : 250, minNights: 2 };
  }
  return { price: weekend ? 380 : 320, minNights: month === 1 ? 3 : 2 };
}

export function petFeeFor(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return PET_FIRST;
  return PET_FIRST + PET_EXTRA * (count - 1);
}

export function quoteStay(input: {
  propertyId: string;
  startDate: string;
  endDate: string;
  guests: number;
  pets?: number;
  overrides?: Record<string, number>;
}): QuoteResult {
  const policy = STAY_POLICIES[input.propertyId];
  if (!policy) return { ok: false, error: "That stay cannot be booked online." };

  let nights: string[];
  try {
    nights = eachNight(input.startDate, input.endDate);
  } catch {
    return { ok: false, error: "Please choose check-in and check-out dates." };
  }

  if (nights.length === 0) {
    return { ok: false, error: "Check-out must be after check-in." };
  }
  if (nights.length > 90) {
    return { ok: false, error: "For stays longer than 90 nights, please enquire." };
  }

  const guests = input.guests;
  if (!Number.isInteger(guests) || guests < 1) {
    return { ok: false, error: "Please enter the number of guests." };
  }
  if (guests > policy.maxGuests) {
    return {
      ok: false,
      error: `This stay sleeps ${policy.maxGuests}. For a larger group, look at The Estate.`,
    };
  }

  const petCount = input.pets ?? 0;
  if (!Number.isInteger(petCount) || petCount < 0 || petCount > MAX_PETS) {
    return { ok: false, error: `We can host up to ${MAX_PETS} pets.` };
  }
  if (petCount > 0 && !policy.petsAllowed) {
    return {
      ok: false,
      error: "Pets are booked with Villa Di Marco. Ask us if you need La Stalla as well.",
    };
  }

  const quotedNights: NightQuote[] = nights.map((date) => {
    const saved = input.overrides?.[date];
    if (typeof saved === "number" && Number.isFinite(saved) && saved >= 0) {
      return { date, price: saved, source: "saved" };
    }
    return { date, price: publishedNightRate(input.propertyId, date).price, source: "published" };
  });

  const minNights = Math.max(
    ...nights.map((date) => publishedNightRate(input.propertyId, date).minNights),
  );
  if (nights.length < minNights) {
    return {
      ok: false,
      error: `This period has a ${minNights}-night minimum.`,
    };
  }

  const accommodation = quotedNights.reduce((sum, night) => sum + night.price, 0);
  const extraGuestCount = Math.max(0, guests - policy.includedGuests);
  const extraGuests = extraGuestCount * policy.extraGuestPerNight * nights.length;
  const petFee = petFeeFor(petCount);
  const cleaning = policy.cleaning;

  return {
    ok: true,
    quote: {
      nights: quotedNights,
      nightCount: nights.length,
      accommodation,
      cleaning,
      extraGuests,
      extraGuestCount,
      petFee,
      petCount,
      total: accommodation + cleaning + extraGuests + petFee,
      minNights,
      levyApplies: nights.length < 28,
    },
  };
}

export function formatAud(amount: number): string {
  return `$${amount.toLocaleString("en-AU")}`;
}

export const VILLA_SEASONS: { label: string; weekday: string; weekend: string; min: string }[] = [
  { label: "January 3–26", weekday: "$1,950", weekend: "$2,300", min: "4 nights (5 over Australia Day 2027)" },
  { label: "January 27–31", weekday: "$1,350", weekend: "$1,850", min: "2 nights" },
  { label: "February", weekday: "$1,300", weekend: "$1,800", min: "2 nights" },
  { label: "March", weekday: "$1,200", weekend: "$1,750", min: "2 nights" },
  { label: "April", weekday: "$1,150", weekend: "$1,650", min: "2 nights" },
  { label: "April 1–11 school holidays", weekday: "$1,450", weekend: "$1,800", min: "3 nights" },
  { label: "May", weekday: "$1,050", weekend: "$1,450", min: "2 nights" },
  { label: "June and July", weekday: "$1,000", weekend: "$1,400", min: "2 nights" },
  { label: "June 26–30 school holidays", weekday: "$1,150", weekend: "$1,500", min: "2 nights" },
  { label: "August", weekday: "$980", weekend: "$1,350", min: "2 nights" },
  { label: "September", weekday: "$1,100", weekend: "$1,500", min: "2 nights" },
  { label: "September 18 – October 3 school holidays", weekday: "$1,200", weekend: "$1,600", min: "2 nights" },
  { label: "October", weekday: "$1,200", weekend: "$1,650", min: "2 nights" },
  { label: "November", weekday: "$1,250", weekend: "$1,800", min: "2 nights" },
  { label: "December 1–18", weekday: "$1,350", weekend: "$1,900", min: "2 nights" },
  { label: "December 19–23", weekday: "$1,850", weekend: "$2,200", min: "4 nights" },
  { label: "Christmas, 24–27 December", weekday: "$2,600", weekend: "$2,600", min: "4 nights" },
  { label: "New Year, 28 December – 2 January", weekday: "$2,900", weekend: "$2,900", min: "5 nights" },
];

export const VILLA_EVENTS_DISPLAY: { label: string; when: string; nightly: string; min: string }[] = [
  { label: "Melbourne Cup long weekend", when: "31 Oct – 3 Nov 2026", nightly: "$1,900", min: "3 nights" },
  { label: "Queenscliff Music Festival", when: "27–29 Nov 2026", nightly: "$2,100", min: "2 nights" },
  { label: "Portarlington Mussel Festival", when: "8–9 Jan 2027", nightly: "$2,300", min: "4 nights" },
  { label: "Australia Day long weekend", when: "23–26 Jan 2027", nightly: "$2,400", min: "5 nights" },
  { label: "Labour Day long weekend", when: "6–8 Mar 2027", nightly: "$1,950", min: "3 nights" },
  { label: "Easter", when: "25–29 Mar 2027", nightly: "$2,150", min: "3 nights (4 preferred)" },
  { label: "King’s Birthday long weekend", when: "12–14 Jun 2027", nightly: "$1,650", min: "3 nights" },
];

export const STALLA_SEASONS: { label: string; weekday: string; weekend: string; min: string }[] = [
  { label: "Winter (May–September)", weekday: "$210", weekend: "$260", min: "2 nights" },
  { label: "Shoulder (March–April, October–November)", weekday: "$250", weekend: "$310", min: "2 nights" },
  { label: "Summer (December–February)", weekday: "$320", weekend: "$380", min: "2 nights (3 in January)" },
  { label: "Christmas and New Year", weekday: "$420", weekend: "$420", min: "4 nights" },
  { label: "Published premium events", weekday: "$340", weekend: "$380", min: "2–3 nights" },
];

export const ESTATE_SEASONS: { label: string; weekday: string; weekend: string; min: string }[] = [
  { label: "Winter (May–September)", weekday: "$1,350", weekend: "$1,800", min: "2 nights" },
  { label: "Shoulder (March–April, October–November)", weekday: "$1,750", weekend: "$2,350", min: "2 nights" },
  { label: "Summer (December–February)", weekday: "$2,400", weekend: "$2,850", min: "3–4 nights" },
  { label: "Christmas and New Year", weekday: "$3,500", weekend: "$3,500", min: "5 nights" },
];
