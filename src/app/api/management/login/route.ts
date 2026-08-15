import { NextRequest, NextResponse } from "next/server";

import { createManagementToken } from "@/lib/adminAuth";
import { validateManagementLogin } from "@/lib/management";

interface Attempt {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, Attempt>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

function checkRateLimit(ip: string): NextResponse | null {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && record.resetAt > now) {
    if (record.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    record.count += 1;
    return null;
  }

  loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  return null;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimited = checkRateLimit(ip);
  if (rateLimited) return rateLimited;

  let body: {
    username?: string;
    password?: string;
    tab?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password?.trim();
  if (!username || !password) {
    return NextResponse.json({ error: "Enter a username and password." }, { status: 400 });
  }

  const user = validateManagementLogin(username, password, body.tab);
  if (!user) {
    return NextResponse.json(
      { error: "Incorrect username, password, or no access to that tab." },
      { status: 401 },
    );
  }

  const token = createManagementToken(user);
  if (!token) {
    return NextResponse.json({ error: "Admin not configured." }, { status: 500 });
  }

  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, tabs: user.tabs },
  });
}
