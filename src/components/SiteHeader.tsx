"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Container } from "@/components/Container";
import { BRAND, NAV_LINKS } from "@/lib/site";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `navlink whitespace-nowrap ${pathname === href ? "text-foreground" : ""}`;

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-[0.18em] uppercase text-foreground">
          {BRAND}
        </Link>

        <nav className="hidden items-center gap-4 xl:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="btn btn-primary">
            Enquire
          </Link>
        </nav>

        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-foreground transition hover:bg-black/5 xl:hidden"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            {mobileMenuOpen ? (
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </Container>

      {mobileMenuOpen && (
        <div className="border-t border-black/10 bg-background xl:hidden">
          <Container className="py-4">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="navlink block py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/contact" className="btn btn-primary mt-3" onClick={() => setMobileMenuOpen(false)}>
                Enquire
              </Link>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
