"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/prices", label: "Prices" },
  { href: "/admin/blocks", label: "Blocks" },
  { href: "/admin/bookings", label: "Bookings" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 border-b border-black/10 pb-2 mb-6">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold tracking-wide transition-colors ${
              active
                ? "bg-brand text-white"
                : "bg-black/5 text-foreground hover:bg-black/10"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
