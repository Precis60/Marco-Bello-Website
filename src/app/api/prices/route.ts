import { NextRequest, NextResponse } from "next/server";

import { managementGuard } from "@/lib/adminAuth";
import { deletePricesForRange, getPricesForRange, setPricesForRange } from "@/lib/db";
import { getProperty } from "@/lib/properties";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const propertyId = params.get("propertyId") ?? "";
  const startDate = params.get("start") ?? "";
  const endDate = params.get("end") ?? "";

  if (!getProperty(propertyId) || !startDate || !endDate) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const prices = await getPricesForRange(propertyId, startDate, endDate);
    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Failed to load prices", error);
    return NextResponse.json(
      { error: "Couldn’t load prices. Please try again shortly." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: {
    propertyId?: string;
    startDate?: string;
    endDate?: string;
    price?: number;
    token?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = managementGuard(body.token, "prices");
  if (denied) return denied;

  const { propertyId, startDate, endDate, price } = body;
  if (!propertyId || !getProperty(propertyId) || !startDate || !endDate || typeof price !== "number" || price < 0) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await setPricesForRange(propertyId, startDate, endDate, price);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to set prices", error);
    return NextResponse.json(
      { error: "Couldn’t save prices. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  let body: {
    propertyId?: string;
    startDate?: string;
    endDate?: string;
    token?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = managementGuard(body.token, "prices");
  if (denied) return denied;

  const { propertyId, startDate, endDate } = body;
  if (!propertyId || !getProperty(propertyId) || !startDate || !endDate) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await deletePricesForRange(propertyId, startDate, endDate);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete prices", error);
    return NextResponse.json(
      { error: "Couldn’t delete prices. Please try again." },
      { status: 500 },
    );
  }
}
