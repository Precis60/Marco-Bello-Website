import { NextRequest, NextResponse } from "next/server";

import { managementGuard } from "@/lib/adminAuth";
import { createBlockedRange, deleteBlockedRange, getBlockedRanges } from "@/lib/db";
import { getProperty } from "@/lib/properties";

export async function GET(request: NextRequest) {
  const denied = managementGuard(request.headers.get("x-admin-token"), "blocks");
  if (denied) return denied;

  const propertyId = request.nextUrl.searchParams.get("propertyId") ?? "";
  if (!getProperty(propertyId)) {
    return NextResponse.json({ error: "Unknown property." }, { status: 400 });
  }

  try {
    const blocks = await getBlockedRanges(propertyId);
    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("Failed to load blocked ranges", error);
    return NextResponse.json(
      { error: "Couldn’t load blocked dates." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: {
    token?: string;
    propertyId?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = managementGuard(body.token, "blocks");
  if (denied) return denied;

  const { propertyId, startDate, endDate, reason } = body;
  if (!propertyId || !getProperty(propertyId) || !startDate || !endDate) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await createBlockedRange({ propertyId, startDate, endDate, reason });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create blocked range", error);
    return NextResponse.json(
      { error: "Couldn’t block those dates." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  let body: { token?: string; id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = managementGuard(body.token, "blocks");
  if (denied) return denied;

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await deleteBlockedRange(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete blocked range", error);
    return NextResponse.json(
      { error: "Couldn’t remove that block." },
      { status: 500 },
    );
  }
}
