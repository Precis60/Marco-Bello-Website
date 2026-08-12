import { NextRequest, NextResponse } from "next/server";

import { adminGuard } from "@/lib/adminAuth";
import { createStaffMessage, deleteStaffMessage, getStaffMessages } from "@/lib/db";
import { getStaffMember } from "@/lib/staff";

export async function GET(request: NextRequest) {
  const denied = adminGuard(request.headers.get("x-admin-token"));
  if (denied) return denied;

  const viewerId = request.nextUrl.searchParams.get("viewerId") ?? "";
  const withId = request.nextUrl.searchParams.get("withId");

  if (!getStaffMember(viewerId) || (withId && !getStaffMember(withId))) {
    return NextResponse.json({ error: "Unknown staff member." }, { status: 400 });
  }

  try {
    const messages = await getStaffMessages(viewerId, withId || null);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to load staff messages", error);
    return NextResponse.json({ error: "Couldn’t load messages." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: { token?: string; senderId?: string; recipientId?: string | null; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = adminGuard(body.token);
  if (denied) return denied;

  const message = body.body?.trim();
  if (!body.senderId || !getStaffMember(body.senderId)) {
    return NextResponse.json({ error: "Unknown sender." }, { status: 400 });
  }
  if (body.recipientId && !getStaffMember(body.recipientId)) {
    return NextResponse.json({ error: "Unknown recipient." }, { status: 400 });
  }
  if (body.recipientId === body.senderId) {
    return NextResponse.json({ error: "You can’t message yourself." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  }

  try {
    await createStaffMessage({
      senderId: body.senderId,
      recipientId: body.recipientId || null,
      body: message,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send staff message", error);
    return NextResponse.json({ error: "Couldn’t send that message." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let body: { token?: string; id?: number; senderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = adminGuard(body.token);
  if (denied) return denied;

  if (typeof body.id !== "number" || !body.senderId || !getStaffMember(body.senderId)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    // Scoped to the sender so people can only remove their own messages.
    await deleteStaffMessage(body.id, body.senderId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete staff message", error);
    return NextResponse.json({ error: "Couldn’t delete that message." }, { status: 500 });
  }
}
