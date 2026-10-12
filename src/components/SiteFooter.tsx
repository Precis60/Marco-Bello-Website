import Link from "next/link";

import { Container } from "@/components/Container";
import { LEVY_NOTE } from "@/lib/rates";
import { ADDRESS_LINE, BRAND, EMAIL, NAV_LINKS, PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-background">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="text-sm font-semibold tracking-[0.18em] uppercase">{BRAND}</div>
            <p className="text-sm leading-6 text-muted">
              A luxury farm stay on Murradoc Hill, Drysdale, the highest point on the Bellarine Peninsula.
              Villa Di Marco, La Stalla, and The Estate.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">Stay</div>
              <div className="flex flex-col gap-2">
                {NAV_LINKS.slice(0, 4).map((link) => (
                  <Link key={link.href} className="footerlink" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">Visit</div>
              <div className="flex flex-col gap-2">
                {NAV_LINKS.slice(4).map((link) => (
                  <Link key={link.href} className="footerlink" href={link.href}>
                    {link.label}
                  </Link>
                ))}
                <Link className="footerlink" href="/contact">
                  Enquire
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">Contact</div>
            <p className="text-muted">{ADDRESS_LINE}</p>
            <a className="footerlink block" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <a className="footerlink block" href={`tel:${PHONE_TEL}`}>
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>

        <div className="mt-10 space-y-2 border-t border-black/10 pt-6 text-xs leading-5 text-muted">
          <div>© {new Date().getFullYear()} {BRAND}. All rights reserved.</div>
          <p>
            {LEVY_NOTE} Check-in is 2:00pm and check-out is 10:00am.
            Pets are welcome in Villa Di Marco — please don&apos;t feed the farm animals.
          </p>
        </div>
      </Container>
    </footer>
  );
}
