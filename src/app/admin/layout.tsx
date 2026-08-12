import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminTabs } from "@/components/AdminTabs";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted">
            Bello Marco Farm
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Property administration
          </h1>
        </div>
        <AdminTabs />
      </div>
      <div className="mt-8 space-y-6 border-t border-black/10 pt-8">{children}</div>
    </Container>
  );
}
