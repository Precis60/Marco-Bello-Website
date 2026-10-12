import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import {
  buildCheckoutLineItems,
  checkoutMetadata,
  checkoutRedirectUrls,
  quoteNotes,
} from "@/lib/checkoutSession";
import {
  attachStripeSession,
  createPendingBooking,
  deletePendingBooking,
  getPricesForRange,
  hasOverlap,
} from "@/lib/db";
import { getProperty } from "@/lib/properties";
import { normaliseDateKey, quoteStay, STAY_POLICIES } from "@/lib/rates";
import { getSiteUrl, PHONE_DISPLAY } from "@/lib/site";
import {
  CHECK_IN_SLOTS,
  CHECK_OUT_SLOTS,
  isListedTime,
  STANDARD_CHECK_IN,
  STANDARD_CHECK_OUT,
  type TimeSlot,
} from "@/lib/stayTimes";

const PRICE_ERROR = "We couldn't confirm the price for these dates. Please try again in a moment.";
const SAVE_ERROR = `We couldn't save your booking. Please try again, or call ${PHONE_DISPLAY} to book.`;
const PAY_ERROR = `We couldn't open the payment page. Please try again, or call ${PHONE_DISPLAY} to book.`;

function cleanShort(value: unknown, max = 40): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function requiredText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | undefined {
  const text = requiredText(value);
  return text || undefined;
}

function requestedTime(
  value: unknown,
  slots: readonly TimeSlot[],
  standard: string,
  label: string,
): string | { error: string } {
  const text = requiredText(value);
  if (!text) return standard;
  if (isListedTime(text, slots)) return text;
  return { error: `Please choose a ${label} from the list.` };
}

function logCheckoutError(stage: string, error: unknown) {
  const detail = error as { message?: string; code?: string; type?: string; param?: string; stack?: string };
  console.error(`Checkout failed while ${stage}`, {
    message: detail?.message ?? String(error),
    code: detail?.code,
    type: detail?.type,
    param: detail?.param,
    stack: detail?.stack,
  });
}

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Online payments aren't configured yet. Please contact us directly to book." },
      { status: 500 },
    );
  }

  let body: {
    propertyId?: string;
    startDate?: string;
    endDate?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    totalGuests?: number;
    childrenAges?: string;
    pets?: number;
    poolTemperature?: string;
    spaTemperature?: string;
    checkInTime?: string;
    checkOutTime?: string;
    specialRequests?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const propertyId = requiredText(body.propertyId);
  const startDate = requiredText(body.startDate);
  const endDate = requiredText(body.endDate);
  const firstName = requiredText(body.firstName);
  const lastName = requiredText(body.lastName);
  const email = requiredText(body.email);
  const phone = requiredText(body.phone);
  const { totalGuests } = body;
  const property = propertyId ? getProperty(propertyId) : undefined;
  const policy = propertyId ? STAY_POLICIES[propertyId] : undefined;

  if (!property || !policy || !startDate || !endDate || !firstName || !lastName || !email || !phone || typeof totalGuests !== "number") {
    return NextResponse.json({ error: "Please fill in all booking details." }, { status: 400 });
  }

  const pets = body.pets ?? 0;
  if (typeof pets !== "number" || !Number.isInteger(pets)) {
    return NextResponse.json({ error: "Please choose how many pets are travelling." }, { status: 400 });
  }

  const checkInTime = requestedTime(body.checkInTime, CHECK_IN_SLOTS, STANDARD_CHECK_IN, "check-in time");
  if (typeof checkInTime !== "string") {
    return NextResponse.json({ error: checkInTime.error }, { status: 400 });
  }
  const checkOutTime = requestedTime(body.checkOutTime, CHECK_OUT_SLOTS, STANDARD_CHECK_OUT, "check-out time");
  if (typeof checkOutTime !== "string") {
    return NextResponse.json({ error: checkOutTime.error }, { status: 400 });
  }

  const preliminary = quoteStay({
    propertyId: property.id,
    startDate,
    endDate,
    guests: totalGuests,
    pets,
  });
  if (!preliminary.ok) {
    return NextResponse.json({ error: preliminary.error }, { status: 400 });
  }

  const overrides: Record<string, number> = {};
  try {
    if (await hasOverlap(property.id, startDate, endDate)) {
      return NextResponse.json(
        { error: "Sorry, those dates were just booked. Please choose different dates." },
        { status: 409 },
      );
    }

    const savedPrices = await getPricesForRange(property.id, startDate, endDate);
    for (const row of savedPrices) {
      overrides[normaliseDateKey(row.date)] = row.price;
    }
  } catch (error) {
    logCheckoutError("confirm-price", error);
    return NextResponse.json({ error: PRICE_ERROR }, { status: 500 });
  }

  const poolTemperature = policy.poolIncluded ? cleanShort(body.poolTemperature) : "";
  const spaTemperature = policy.poolIncluded ? cleanShort(body.spaTemperature) : "";
  const quoted = quoteStay({
    propertyId: property.id,
    startDate,
    endDate,
    guests: totalGuests,
    pets,
    overrides,
  });
  if (!quoted.ok) {
    return NextResponse.json({ error: quoted.error }, { status: 400 });
  }

  const guestNotes = optionalText(body.specialRequests) ?? "";
  const notes = [guestNotes, quoteNotes(quoted.quote, policy.petsAllowed, poolTemperature, spaTemperature)]
    .filter(Boolean)
    .join("\n\n");

  let bookingId: number;
  try {
    bookingId = await createPendingBooking({
      propertyId: property.id,
      startDate,
      endDate,
      firstName,
      lastName,
      email,
      phone,
      totalGuests,
      childrenAges: optionalText(body.childrenAges),
      checkInTime,
      checkOutTime,
      specialRequests: notes,
    });
  } catch (error) {
    logCheckoutError("save-booking", error);
    return NextResponse.json({ error: SAVE_ERROR }, { status: 500 });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);
    const urls = checkoutRedirectUrls(getSiteUrl());
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: buildCheckoutLineItems({
        propertyName: property.name,
        startDate,
        endDate,
        quote: quoted.quote,
        policy,
      }),
      metadata: checkoutMetadata({
        bookingId,
        propertyId: property.id,
        startDate,
        endDate,
        totalAud: quoted.quote.total,
      }),
      success_url: urls.success_url,
      cancel_url: urls.cancel_url,
    });

    if (!session.url) {
      throw new Error("Stripe Checkout did not return a redirect URL.");
    }

    await attachStripeSession(bookingId, session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    logCheckoutError("open-payment", error);
    try {
      await deletePendingBooking(bookingId);
    } catch (cleanupError) {
      logCheckoutError("release-dates", cleanupError);
    }
    return NextResponse.json({ error: PAY_ERROR }, { status: 500 });
  }
}
