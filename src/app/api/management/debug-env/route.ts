import { NextResponse } from "next/server";

/**
 * Temporary diagnostic endpoint — reports which management env vars are
 * configured without exposing their values. Delete this route once the
 * login issue is resolved.
 */
export async function GET() {
  const keys = ["MANAGEMENT_HASH_LUCAS", "MANAGEMENT_HASH_MARA", "MANAGEMENT_HASH_JAMIE", "ADMIN_TOKEN"];
  const status = Object.fromEntries(
    keys.map((key) => [key, Boolean(process.env[key]?.trim())]),
  );
  return NextResponse.json({ status, vercelEnv: process.env.VERCEL_ENV ?? "unknown" });
}
