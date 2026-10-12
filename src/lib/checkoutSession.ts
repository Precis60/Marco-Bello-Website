import type Stripe from "stripe";

import { formatAud, LEVY_EXEMPT_NOTE, LEVY_NOTE, type StayPolicy, type StayQuote } from "./rates";

export const STRIPE_METADATA_VALUE_MAX = 500;

/** Stripe rejects a line item unless unit_amount is a positive integer number of cents. */
export function audToCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error(`Charge amount is not a finite number: ${String(amount)}`);
  }
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents) || cents < 1) {
    throw new Error(`Stripe needs a positive whole number of cents, got ${cents} from ${amount}`);
  }
  return cents;
}

export function quoteNotes(
  quote: StayQuote,
  petsAllowed: boolean,
  poolTemperature: string,
  spaTemperature: string,
): string {
  const lines = ["Website quote charged at checkout (AUD):"];
  lines.push(`Accommodation: ${formatAud(quote.accommodation)}`);
  lines.push(`Cleaning: ${formatAud(quote.cleaning)}`);
  if (quote.extraGuests > 0) lines.push(`Extra guests: ${formatAud(quote.extraGuests)}`);
  if (quote.petFee > 0) lines.push(`Pet fee: ${formatAud(quote.petFee)}`);
  lines.push(`Total charged: ${formatAud(quote.total)}`);
  lines.push(quote.levyApplies ? LEVY_NOTE : LEVY_EXEMPT_NOTE);
  if (poolTemperature) lines.push(`Pool temperature request: ${poolTemperature}`);
  if (spaTemperature) lines.push(`Spa temperature request: ${spaTemperature}`);
  if (petsAllowed) {
    lines.push(
      quote.petCount > 0
        ? `Pets: ${quote.petCount}. Please do not feed the farm animals.`
        : "Pets: none.",
    );
  }
  return lines.join("\n");
}

export function buildCheckoutLineItems(input: {
  propertyName: string;
  startDate: string;
  endDate: string;
  quote: StayQuote;
  policy: StayPolicy;
}): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const { propertyName, startDate, endDate, quote, policy } = input;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "aud",
        unit_amount: audToCents(quote.accommodation),
        product_data: {
          name: `${propertyName} — ${quote.nightCount} night${quote.nightCount > 1 ? "s" : ""}`,
          description: `${startDate} to ${endDate}`,
        },
      },
    },
    {
      quantity: 1,
      price_data: {
        currency: "aud",
        unit_amount: audToCents(quote.cleaning),
        product_data: {
          name: `Cleaning — ${propertyName}`,
          description: "Charged once per stay",
        },
      },
    },
  ];

  if (quote.extraGuests > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "aud",
        unit_amount: audToCents(quote.extraGuests),
        product_data: {
          name: `Extra guests — ${quote.extraGuestCount}`,
          description: `${formatAud(policy.extraGuestPerNight)} per person per night above ${policy.includedGuests} guests`,
        },
      },
    });
  }

  if (quote.petFee > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "aud",
        unit_amount: audToCents(quote.petFee),
        product_data: {
          name: `Pets — ${quote.petCount}`,
          description: "Per stay. Please do not feed the farm animals.",
        },
      },
    });
  }

  return lineItems;
}

/**
 * Stripe metadata values must be strings of at most 500 characters.
 * The stay quote is stored on the booking, not here: a quote with pets,
 * extra guests and temperature requests can exceed that limit.
 */
export function checkoutMetadata(input: {
  bookingId: number;
  propertyId: string;
  startDate: string;
  endDate: string;
  totalAud: number;
}): Stripe.MetadataParam {
  const metadata: Record<string, string> = {
    bookingId: String(input.bookingId),
    propertyId: input.propertyId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalAud: String(input.totalAud),
  };

  for (const [key, value] of Object.entries(metadata)) {
    if (key.length > 40 || value.length > STRIPE_METADATA_VALUE_MAX) {
      throw new Error(
        `Stripe metadata ${key} is ${value.length} characters; the limit is ${STRIPE_METADATA_VALUE_MAX}`,
      );
    }
  }

  return metadata;
}

/**
 * Live Stripe Checkout rejects a success or cancel URL that is not absolute https.
 * Local test mode may use http://localhost.
 */
export function checkoutRedirectUrls(origin: string): { success_url: string; cancel_url: string } {
  const base = origin.trim().replace(/\/$/, "");
  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    throw new Error(`Stripe success and cancel URLs need an absolute https origin, received "${base}"`);
  }

  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  const allowed = parsed.protocol === "https:" || (parsed.protocol === "http:" && local);
  if (!allowed || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error(`Stripe success and cancel URLs need an absolute https origin, received "${base}"`);
  }

  return {
    success_url: `${parsed.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${parsed.origin}/booking/cancel`,
  };
}
