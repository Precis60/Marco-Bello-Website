import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { attachStripeSession, createPendingBooking, getPricesForRange, hasOverlap } from "@/lib/db";
import { getProperty } from "@/lib/properties";
import {
  formatAud,
  LEVY_EXEMPT_NOTE,
  LEVY_NOTE,
  normaliseDateKey,
  quoteStay,
  STAY_POLICIES,
  type StayQuote,
} from "@/lib/rates";

function cleanShort(value: unknown, max = 40): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function quoteNotes(quote: StayQuote, petsAllowed: boolean, poolTemperature: string, spaTemperature: string) {
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

  const {
    propertyId,
    startDate,
    endDate,
    firstName,
    lastName,
    email,
    phone,
    totalGuests,
    childrenAges,
    checkInTime,
    checkOutTime,
    specialRequests,
  } = body;
  const property = propertyId ? getProperty(propertyId) : undefined;
  const policy = propertyId ? STAY_POLICIES[propertyId] : undefined;

  if (
    !property ||
    !policy ||
    !startDate ||
    !endDate ||
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    typeof totalGuests !== "number"
  ) {
    return NextResponse.json({ error: "Please fill in all booking details." }, { status: 400 });
  }

  const pets = body.pets ?? 0;
  if (typeof pets !== "number" || !Number.isInteger(pets)) {
    return NextResponse.json({ error: "Please choose how many pets are travelling." }, { status: 400 });
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
    console.error("Failed to price checkout", error);
    return NextResponse.json(
      { error: "Something went wrong starting your booking. Please try again." },
      { status: 500 },
    );
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

  const guestNotes = typeof specialRequests === "string" ? specialRequests.trim() : "";
  const notes = [guestNotes, quoteNotes(quoted.quote, policy.petsAllowed, poolTemperature, spaTemperature)]
    .filter(Boolean)
    .join("\n\n");

  try {
    const bookingId = await createPendingBooking({
      propertyId: property.id,
      startDate,
      endDate,
      firstName,
      lastName,
      email,
      phone,
      totalGuests,
      childrenAges,
      checkInTime,
      checkOutTime,
      specialRequests: notes,
    });

    const stripe = new Stripe(stripeSecretKey);
    const origin = request.nextUrl.origin;
    const { quote } = quoted;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: quote.accommodation * 100,
          product_data: {
            name: `${property.name} — ${quote.nightCount} night${quote.nightCount > 1 ? "s" : ""}`,
            description: `${startDate} to ${endDate}`,
          },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: quote.cleaning * 100,
          product_data: {
            name: `Cleaning — ${property.name}`,
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
          unit_amount: quote.extraGuests * 100,
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
          unit_amount: quote.petFee * 100,
          product_data: {
            name: `Pets — ${quote.petCount}`,
            description: "Per stay. Please do not feed the farm animals.",
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: lineItems,
      metadata: {
        bookingId: String(bookingId),
        propertyId: property.id,
        startDate,
        endDate,
        totalAud: String(quote.total),
      },
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking/cancel`,
    });

    await attachStripeSession(bookingId, session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create checkout session", error);
    return NextResponse.json(
      { error: "Something went wrong starting your booking. Please try again." },
      { status: 500 },
    );
  }
}
