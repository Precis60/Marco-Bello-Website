import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { confirmBookingBySessionId } from "@/lib/db";

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  const stripe = new Stripe(stripeSecretKey);

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header.");
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await confirmBookingBySessionId(session.id);
    } catch (error) {
      console.error("Failed to confirm booking after payment", error);
      return NextResponse.json({ error: "Failed to record booking." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
