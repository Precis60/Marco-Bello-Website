import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { attachStripeSession, calculateTotal, createPendingBooking, hasOverlap } from "@/lib/db";
import { getProperty } from "@/lib/properties";

function nightsBetween(startDate: string, endDate: string) {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
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
    guestName?: string;
    guestEmail?: string;
    specialRequests?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { propertyId, startDate, endDate, guestName, guestEmail, specialRequests } = body;
  const property = propertyId ? getProperty(propertyId) : undefined;

  if (!property || !startDate || !endDate || !guestName || !guestEmail) {
    return NextResponse.json({ error: "Please fill in all booking details." }, { status: 400 });
  }

  const nights = nightsBetween(startDate, endDate);
  if (!Number.isFinite(nights) || nights < property.minNights) {
    return NextResponse.json(
      { error: `Minimum stay for ${property.name} is ${property.minNights} nights.` },
      { status: 400 },
    );
  }

  try {
    if (await hasOverlap(property.id, startDate, endDate)) {
      return NextResponse.json(
        { error: "Sorry, those dates were just booked. Please choose different dates." },
        { status: 409 },
      );
    }

    const { total } = await calculateTotal(property.id, startDate, endDate, property.nightlyPrice);

    const bookingId = await createPendingBooking({
      propertyId: property.id,
      startDate,
      endDate,
      guestName,
      guestEmail,
      specialRequests,
    });

    const stripe = new Stripe(stripeSecretKey);
    const origin = request.nextUrl.origin;
    const amountInCents = total * 100;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: guestEmail,
      line_items: [
        {
          price_data: {
            currency: "aud",
            unit_amount: amountInCents,
            product_data: {
              name: `${property.name} — ${nights} night${nights > 1 ? "s" : ""}`,
              description: `${startDate} to ${endDate} — $${total} total`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: String(bookingId),
        propertyId: property.id,
        startDate,
        endDate,
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
