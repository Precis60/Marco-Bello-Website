import { NextRequest, NextResponse } from "next/server";

import { getAdminToken } from "@/lib/adminAuth";
import { validateManagementLogin } from "@/lib/management";

export async function POST(request: NextRequest) {
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

  const token = getAdminToken();
  if (!token) {
    return NextResponse.json({ error: "Admin not configured." }, { status: 500 });
  }

  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, tabs: user.tabs },
  });
}
