import Link from "next/link";

import { Container } from "@/components/Container";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-background">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="text-sm font-semibold tracking-[0.18em] uppercase">
              Marco Bello
            </div>
            <p className="text-sm text-muted">
              Luxury rural stays and curated farm sales — livestock, produce, and
              trees.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                Explore
              </div>
              <div className="flex flex-col gap-2">
                <Link className="footerlink" href="/rentals">
                  Luxury Rentals
                </Link>
                <Link className="footerlink" href="/farm-sales">
                  Farm Sales
                </Link>
                <Link className="footerlink" href="/about">
                  About
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                Get in touch
              </div>
              <div className="flex flex-col gap-2">
                <Link className="footerlink" href="/contact">
                  Enquire
                </Link>
                <a className="footerlink" href="mailto:hello@example.com">
                  hello@example.com
                </a>
                <a className="footerlink" href="tel:+61000000000">
                  +61 000 000 000
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
              Location
            </div>
            <p className="text-sm text-muted">
              Replace with your region and pickup / inspection details.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-black/10 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} Marco Bello. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a className="footerlink" href="#">
              Instagram
            </a>
            <a className="footerlink" href="#">
              Facebook
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
