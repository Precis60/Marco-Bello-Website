import { NextRequest, NextResponse } from "next/server";

import { getAdminToken } from "@/lib/adminAuth";
import { calculateTotal, deleteBooking, getAllBookings, updateBooking } from "@/lib/db";
import { getProperty } from "@/lib/properties";

function requireAuth(request: NextRequest):
  | { ok: true; token: string }
  | { ok: false; response: NextResponse } {
  const adminToken = getAdminToken();
  if (!adminToken) {
    return { ok: false, response: NextResponse.json({ error: "Admin not configured." }, { status: 500 }) };
  }

  const token = request.headers.get("x-admin-token");
  if (token?.trim() !== adminToken) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  return { ok: true, token };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const rows = await getAllBookings();
    const enriched = await Promise.all(
      rows.map(async (row) => {
        const property = getProperty(row.property_id);
        const defaultPrice = property?.nightlyPrice ?? 0;
        const { total, breakdown } = await calculateTotal(
          row.property_id,
          row.start_date,
          row.end_date,
          defaultPrice,
        );
        return {
          id: row.id,
          propertyId: row.property_id,
          propertyName: property?.name ?? row.property_id,
          startDate: row.start_date,
          endDate: row.end_date,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          totalGuests: row.total_guests,
          childrenAges: row.children_ages,
          checkInTime: row.check_in_time,
          checkOutTime: row.check_out_time,
          specialRequests: row.special_requests,
          status: row.status,
          createdAt: row.created_at,
          dailyRate: total / breakdown.length,
          total,
          breakdown,
        };
      }),
    );

    return NextResponse.json({ bookings: enriched });
  } catch (error) {
    console.error("Failed to load bookings", error);
    return NextResponse.json({ error: "Couldn’t load bookings." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: {
    id?: number;
    startDate?: string;
    endDate?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    totalGuests?: number;
    childrenAges?: string;
    checkInTime?: string;
    checkOutTime?: string;
    specialRequests?: string;
    status?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { id, ...fields } = body;
  if (typeof id !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await updateBooking(id, {
      start_date: fields.startDate,
      end_date: fields.endDate,
      first_name: fields.firstName,
      last_name: fields.lastName,
      email: fields.email,
      phone: fields.phone,
      total_guests: fields.totalGuests,
      children_ages: fields.childrenAges,
      check_in_time: fields.checkInTime,
      check_out_time: fields.checkOutTime,
      special_requests: fields.specialRequests,
      status: fields.status,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update booking", error);
    const message = error instanceof Error ? error.message : "Couldn’t update booking.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: { id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await deleteBooking(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete booking", error);
    return NextResponse.json({ error: "Couldn’t delete booking." }, { status: 500 });
  }
}
