import { NextRequest, NextResponse } from "next/server";

import { managementGuard } from "@/lib/adminAuth";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  setCalendarEventStatus,
  updateCalendarEvent,
} from "@/lib/db";
import { getProperty } from "@/lib/properties";

const KINDS = ["event", "scheduled-work", "confirmed-work", "contractor"];
const STATUSES = ["scheduled", "confirmed", "completed", "cancelled"];

export async function GET(request: NextRequest) {
  const denied = managementGuard(request.headers.get("x-admin-token"), "calendar");
  if (denied) return denied;

  try {
    const events = await getCalendarEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Failed to load calendar events", error);
    return NextResponse.json(
      { error: "Couldn’t load the calendar." },
      { status: 500 },
    );
  }
}

interface EventBody {
  token?: string;
  id?: number;
  propertyId?: string | null;
  title?: string;
  kind?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  contractor?: string;
  contact?: string;
  notes?: string;
}

interface EventFields {
  propertyId: string | null;
  title: string;
  kind: string;
  status: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  contractor: string | null;
  contact: string | null;
  notes: string | null;
}

/** Validates a create/edit payload, returning either the cleaned fields or an error response. */
function readEventFields(
  body: EventBody,
): { fields: EventFields } | { error: NextResponse } {
  const title = body.title?.trim();
  const kind = body.kind ?? "event";
  const status = body.status ?? "scheduled";
  const startDate = body.startDate;
  const endDate = body.endDate || body.startDate;

  if (!title || !startDate || !endDate) {
    return {
      error: NextResponse.json(
        { error: "Enter a title and a start date." },
        { status: 400 },
      ),
    };
  }
  if (endDate < startDate) {
    return {
      error: NextResponse.json(
        { error: "The last day can’t be before the first." },
        { status: 400 },
      ),
    };
  }
  if (!KINDS.includes(kind) || !STATUSES.includes(status)) {
    return {
      error: NextResponse.json(
        { error: "Unknown event type or status." },
        { status: 400 },
      ),
    };
  }
  if (body.propertyId && !getProperty(body.propertyId)) {
    return {
      error: NextResponse.json({ error: "Unknown property." }, { status: 400 }),
    };
  }

  return {
    fields: {
      propertyId: body.propertyId || null,
      title,
      kind,
      status,
      startDate,
      endDate,
      startTime: body.startTime || null,
      endTime: body.endTime || null,
      contractor: body.contractor?.trim() || null,
      contact: body.contact?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  };
}

export async function POST(request: NextRequest) {
  let body: EventBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = managementGuard(body.token, "calendar");
  if (denied) return denied;

  const parsed = readEventFields(body);
  if ("error" in parsed) return parsed.error;

  try {
    await createCalendarEvent(parsed.fields);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create calendar event", error);
    return NextResponse.json(
      { error: "Couldn’t save that entry." },
      { status: 500 },
    );
  }
}

/** Updates a whole entry, or just its status when only a status is sent. */
export async function PUT(request: NextRequest) {
  let body: EventBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const denied = managementGuard(body.token, "calendar");
  if (denied) return denied;

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.title === undefined) {
    if (!body.status || !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    try {
      await setCalendarEventStatus(body.id, body.status);
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("Failed to update calendar event", error);
      return NextResponse.json(
        { error: "Couldn’t update that entry." },
        { status: 500 },
      );
    }
  }

  const parsed = readEventFields(body);
  if ("error" in parsed) return parsed.error;

  try {
    await updateCalendarEvent(body.id, parsed.fields);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update calendar event", error);
    return NextResponse.json(
      { error: "Couldn’t update that entry." },
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

  const denied = managementGuard(body.token, "calendar");
  if (denied) return denied;

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await deleteCalendarEvent(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete calendar event", error);
    return NextResponse.json(
      { error: "Couldn’t delete that entry." },
      { status: 500 },
    );
  }
}
