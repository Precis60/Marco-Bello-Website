import Link from "next/link";

import { Container } from "@/components/Container";

export default function FarmSalesPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Produce & Plant Sales
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Livestock, seasonal produce, and trees grown with care. Add listings
            with dates, quantities, and inspection/pickup details.
          </p>
          <div className="mt-8 flex gap-3">
            <Link className="btn btn-primary" href="/contact">
              Enquire
            </Link>
            <Link className="btn btn-secondary" href="/">
              Back to home
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {["Honey, Wine & Olive Oil", "Produce", "Trees"].map((title) => (
            <section
              key={title}
              className="rounded-2xl border border-black/10 bg-surface p-6"
            >
              <h2 className="text-sm font-semibold tracking-[0.12em] uppercase">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Add your current offerings, pricing guidance, and seasonal
                availability.
              </p>
              <div className="mt-6 grid gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-black/5 p-4">
                    <div className="text-sm font-medium text-foreground">
                      Listing {i}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      Details, pricing, and contact info
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
