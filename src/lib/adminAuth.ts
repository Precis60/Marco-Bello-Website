import { NextResponse } from "next/server";
import crypto from "crypto";

import { canAccessTab, getManagementUserById } from "@/lib/management";

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

export interface VerifiedManagementUser {
  id: string;
  tabs: string[];
}

/** Issue a signed token for a management user (valid for 24 hours). */
export function createManagementToken(user: { id: string }): string | undefined {
  const adminToken = getAdminToken();
  if (!adminToken) return undefined;

  const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const payload = `${user.id}:${expiry}`;
  const signature = crypto.createHmac("sha256", adminToken).update(payload).digest("hex");
  return `${payload}:${signature}`;
}

/** Verify a signed management token. */
export function verifyManagementToken(token: string): VerifiedManagementUser | null {
  const adminToken = getAdminToken();
  if (!adminToken) return null;

  const parts = token.trim().split(":");
  if (parts.length !== 3) return null;

  const [id, expiry, signature] = parts;
  if (!id || !expiry || !signature) return null;

  const now = Math.floor(Date.now() / 1000);
  const expires = Number(expiry);
  if (!Number.isFinite(expires) || now > expires) return null;

  const payload = `${id}:${expiry}`;
  const expected = crypto.createHmac("sha256", adminToken).update(payload).digest("hex");

  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  const user = getManagementUserById(id);
  if (!user) return null;

  return { id: user.id, tabs: user.tabs };
}

/**
 * Allows the master `ADMIN_TOKEN` or a valid signed management token with
 * access to the given admin tab. Returns null when authorised.
 */
export function managementGuard(
  token: string | null | undefined,
  tab: string,
): NextResponse | null {
  const adminToken = getAdminToken();
  if (!adminToken) {
    return NextResponse.json({ error: "Admin not configured." }, { status: 500 });
  }

  const trimmed = token?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (trimmed === adminToken) return null;

  const user = verifyManagementToken(trimmed);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canAccessTab(user, tab)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}


