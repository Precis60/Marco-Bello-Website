"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/prices", label: "Prices" },
  { href: "/admin/blocks", label: "Blocks" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/expenses", label: "Expenses" },
  { href: "/admin/contacts", label: "Contacts" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="flex flex-wrap gap-1 rounded-full border border-black/10 bg-black/[0.03] p-1"
    >
      {tabs.map((tab) => {
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
    </nav>
  );
}
