import { NextRequest, NextResponse } from "next/server";

import { getBookedRanges } from "@/lib/db";
import { getProperty } from "@/lib/properties";

export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("propertyId") ?? "";

  if (!getProperty(propertyId)) {
    return NextResponse.json({ error: "Unknown property." }, { status: 400 });
  }

  try {
    const ranges = await getBookedRanges(propertyId);
    return NextResponse.json({ ranges });
  } catch (error) {
    console.error("Failed to load availability", error);
    return NextResponse.json(
      { error: "Couldn't load availability right now. Please try again shortly." },
      { status: 500 },
    );
  }
}
