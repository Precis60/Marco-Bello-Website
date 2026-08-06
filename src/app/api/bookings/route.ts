import { NextRequest, NextResponse } from "next/server";

import { calculateTotal, getAllBookings } from "@/lib/db";
import { getProperty } from "@/lib/properties";

function getAdminToken(): string | undefined {
  return process.env.ADMIN_TOKEN;
}

export async function GET(request: NextRequest) {
  const adminToken = getAdminToken();
  if (!adminToken) {
    return NextResponse.json({ error: "Admin not configured." }, { status: 500 });
  }

  const token = request.headers.get("x-admin-token");
  if (token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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
