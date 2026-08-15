"use client";

import { useEffect, useState } from "react";

import { AdminLogin } from "@/components/AdminLogin";

interface ManagementUser {
  id: string;
  name: string;
  tabs: string[];
}

const MANAGEMENT_USER_KEY = "bmf-management-user";

function readFirstTab(user: ManagementUser | null): string {
  if (user?.tabs?.length) return `/admin/${user.tabs[0]}`;
  return "/admin/calendar";
}

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    const raw = window.localStorage.getItem(MANAGEMENT_USER_KEY);
    const user: ManagementUser | null = raw ? JSON.parse(raw) : null;
    window.location.href = readFirstTab(user);
  }, [authenticated]);

  if (authenticated) {
    return (
      <div className="py-12 text-center text-sm text-muted">Redirecting…</div>
    );
  }

  return (
    <div className="py-12 sm:py-16">
      <AdminLogin
        token={token}
        onTokenChange={setToken}
        onSubmit={() => setAuthenticated(true)}
        description="Sign in to access the property administration area."
      />
    </div>
  );
}
