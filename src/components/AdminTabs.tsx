"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ManagementUser {
  id: string;
  name: string;
  tabs: string[];
}

const tabs = [
  { href: "/admin/blocks", label: "Blocks", key: "blocks" },
  { href: "/admin/bookings", label: "Bookings", key: "bookings" },
  { href: "/admin/calendar", label: "Calendar", key: "calendar" },
  { href: "/admin/contacts", label: "Contacts", key: "contacts" },
  { href: "/admin/expenses", label: "Expenses", key: "expenses" },
  { href: "/admin/messenger", label: "Messenger", key: "messenger" },
  { href: "/admin/prices", label: "Prices", key: "prices" },
  { href: "/admin/tasks", label: "Tasks", key: "tasks" },
];

const MANAGEMENT_USER_KEY = "bmf-management-user";
const MANAGEMENT_TOKEN_KEY = "bmf-management-token";
const INACTIVITY_MS = 5 * 60 * 1000;

function hasSessionToken(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.sessionStorage.getItem(MANAGEMENT_TOKEN_KEY);
}

function readStoredUser(): ManagementUser | null {
  if (typeof window === "undefined") return null;
  if (!hasSessionToken()) return null;
  const raw = window.localStorage.getItem(MANAGEMENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ManagementUser;
  } catch {
    return null;
  }
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(MANAGEMENT_TOKEN_KEY);
  window.localStorage.removeItem(MANAGEMENT_USER_KEY);
  window.location.reload();
}

export function AdminTabs() {
  const pathname = usePathname();
  const [user, setUser] = useState<ManagementUser | null>(() => readStoredUser());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleLogin = (e: Event) => {
      const detail = (e as CustomEvent).detail as ManagementUser | undefined;
      setUser(detail ?? readStoredUser());
    };

    const handleStorage = () => {
      setUser(readStoredUser());
    };

    const startInactivityTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        clearSession();
      }, INACTIVITY_MS);
    };

    const resetTimer = () => {
      if (hasSessionToken()) startInactivityTimer();
    };

    window.addEventListener("bmf-management-login", handleLogin);
    window.addEventListener("storage", handleStorage);

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    if (hasSessionToken()) startInactivityTimer();

    return () => {
      window.removeEventListener("bmf-management-login", handleLogin);
      window.removeEventListener("storage", handleStorage);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user]);

  const signedIn = hasSessionToken();

  if (pathname === "/admin") return null;

  const visibleTabs = user ? tabs.filter((tab) => user.tabs.includes(tab.key)) : signedIn ? tabs : [];

  return (
    <nav
      aria-label="Admin sections"
      className="flex flex-wrap gap-1 rounded-full border border-black/10 bg-black/[0.03] p-1"
    >
      {visibleTabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition-colors ${
              active ? "bg-brand text-white shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      {user && (
        <button
          type="button"
          onClick={() => clearSession()}
          className="rounded-full px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Log out
        </button>
      )}
    </nav>
  );
}
