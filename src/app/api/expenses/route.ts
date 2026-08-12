import { NextRequest, NextResponse } from "next/server";

import { adminGuard } from "@/lib/adminAuth";
import { createExpense, deleteExpense, getExpenses, setExpensePaid } from "@/lib/db";
import { getProperty } from "@/lib/properties";

export async function GET(request: NextRequest) {
  const denied = adminGuard(request.headers.get("x-admin-token"));
  if (denied) return denied;

  try {
    const expenses = await getExpenses();
    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Failed to load expenses", error);
    return NextResponse.json({ error: "Couldn’t load expenses." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: {
    token?: string;
    propertyId?: string | null;
    date?: string;
    category?: string;
    vendor?: string;
    description?: string;
    amount?: number;
    paid?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = adminGuard(body.token);
  if (denied) return denied;

  const { propertyId, date, category, amount } = body;
  if (!date || !category || typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a date, category and amount." }, { status: 400 });
  }
  if (propertyId && !getProperty(propertyId)) {
    return NextResponse.json({ error: "Unknown property." }, { status: 400 });
  }

  try {
    await createExpense({
      propertyId: propertyId || null,
      date,
      category,
      vendor: body.vendor?.trim() || null,
      description: body.description?.trim() || null,
      amountCents: Math.round(amount * 100),
      paid: body.paid ?? false,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create expense", error);
    return NextResponse.json({ error: "Couldn’t save that expense." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let body: { token?: string; id?: number; paid?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = adminGuard(body.token);
  if (denied) return denied;

  if (typeof body.id !== "number" || typeof body.paid !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await setExpensePaid(body.id, body.paid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update expense", error);
    return NextResponse.json({ error: "Couldn’t update that expense." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let body: { token?: string; id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = adminGuard(body.token);
  if (denied) return denied;

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await deleteExpense(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete expense", error);
    return NextResponse.json({ error: "Couldn’t delete that expense." }, { status: 500 });
  }
}
