import { NextResponse } from "next/server";

/**
 * Returns a response to send back when the request isn't an authorised admin,
 * or null when the token matches `ADMIN_TOKEN`.
 */
export function adminGuard(token: string | null | undefined) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: "Admin not configured." }, { status: 500 });
  }
  if (token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}
