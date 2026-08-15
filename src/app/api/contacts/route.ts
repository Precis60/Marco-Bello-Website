import { NextRequest, NextResponse } from "next/server";

import { managementGuard } from "@/lib/adminAuth";
import { ContactInput, createContact, deleteContact, getContacts, updateContact } from "@/lib/db";

interface ContactBody {
  token?: string;
  id?: number;
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

/** Trims optional text fields to null so blank inputs don't store empty strings. */
function toContact(body: ContactBody): ContactInput | null {
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  if (!firstName || !lastName) return null;

  return {
    firstName,
    lastName,
    company: body.company?.trim() || null,
    position: body.position?.trim() || null,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    address: body.address?.trim() || null,
    notes: body.notes?.trim() || null,
  };
}

async function readBody(request: NextRequest): Promise<ContactBody | null> {
  try {
    return (await request.json()) as ContactBody;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const denied = managementGuard(request.headers.get("x-admin-token"), "contacts");
  if (denied) return denied;

  try {
    const contacts = await getContacts();
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Failed to load contacts", error);
    return NextResponse.json({ error: "Couldn’t load contacts." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const denied = managementGuard(body.token, "contacts");
  if (denied) return denied;

  const contact = toContact(body);
  if (!contact) {
    return NextResponse.json({ error: "Enter a first and last name." }, { status: 400 });
  }

  try {
    await createContact(contact);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create contact", error);
    return NextResponse.json({ error: "Couldn’t save that contact." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const denied = managementGuard(body.token, "contacts");
  if (denied) return denied;

  const contact = toContact(body);
  if (typeof body.id !== "number" || !contact) {
    return NextResponse.json({ error: "Enter a first and last name." }, { status: 400 });
  }

  try {
    await updateContact(body.id, contact);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update contact", error);
    return NextResponse.json({ error: "Couldn’t update that contact." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const denied = managementGuard(body.token, "contacts");
  if (denied) return denied;

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await deleteContact(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete contact", error);
    return NextResponse.json({ error: "Couldn’t delete that contact." }, { status: 500 });
  }
}
