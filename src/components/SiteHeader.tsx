"use client";

import Link from "next/link";
import { useState } from "react";

import { Container } from "@/components/Container";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.18em] uppercase text-foreground"
        >
          Bello Marco Farm
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/rentals" className="navlink">
            Rental Availability
          </Link>
          <Link href="/farm-sales" className="navlink">
            Honey, Wine, Olive Oil and Small Plants
          </Link>
          <Link href="/about" className="navlink">
            About
          </Link>
          <Link href="/contact" className="btn btn-primary">
            Enquire
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-foreground transition hover:bg-black/5"
            aria-label="Toggle menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {mobileMenuOpen ? (
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 5H17M3 10H17M3 15H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {mobileMenuOpen && (
        <div className="border-t border-black/10 bg-background md:hidden">
          <Container className="py-4">
            <nav className="flex flex-col gap-3">
              <Link
                href="/rentals"
                className="navlink block py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Rental Availability
              </Link>
              <Link
                href="/farm-sales"
                className="navlink block py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Honey, Wine, Olive Oil and Small Plants
              </Link>
              <Link
                href="/about"
                className="navlink block py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="btn btn-primary mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Enquire
              </Link>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
