import Link from "next/link";

import { Container } from "@/components/Container";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.18em] uppercase text-foreground"
        >
          Marco Bello
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/rentals" className="navlink">
            Rental Availability
          </Link>
          <Link href="/farm-sales" className="navlink">
            Honey and Wine, Olive Oil and small plants
          </Link>
          <Link href="/about" className="navlink">
            About
          </Link>
          <Link href="/contact" className="btn btn-primary">
            Enquire
          </Link>
        </nav>

        <div className="md:hidden">
          <Link href="/contact" className="btn btn-primary">
            Enquire
          </Link>
        </div>
      </Container>
    </header>
  );
}
