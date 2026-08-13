import { NextResponse } from "next/server";

/**
 * The configured admin token, ignoring whitespace picked up when the value is
 * pasted into a hosting provider's environment variable editor.
 */
export function getAdminToken(): string | undefined {
  return process.env.ADMIN_TOKEN?.trim() || undefined;
}

/**
 * Returns a response to send back when the request isn't an authorised admin,
 * or null when the token matches `ADMIN_TOKEN`.
 */
export function adminGuard(token: string | null | undefined) {
  const adminToken = getAdminToken();
  if (!adminToken) {
    return NextResponse.json({ error: "Admin not configured." }, { status: 500 });
  }
  if (token?.trim() !== adminToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}
