import Link from "next/link";

import { Container } from "@/components/Container";

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_30%_10%,rgba(31,58,46,0.16),transparent_60%),radial-gradient(900px_500px_at_80%_40%,rgba(176,141,87,0.12),transparent_55%)]" />
        <Container className="relative py-16 sm:py-24">
          <div className="grid items-end gap-10 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">
                Luxury rural stays · Farm sales
              </div>
              <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">
                A refined farm experience — to stay, to source, to savour.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted">
                Discover luxury rentals set on working land, plus curated farm
                offerings: livestock, seasonal produce, and trees grown with
                care.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/rentals" className="btn btn-primary">
                  Explore rentals
                </Link>
                <Link href="/farm-sales" className="btn btn-secondary">
                  View farm sales
                </Link>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="rounded-3xl border border-black/10 bg-surface p-3">
                <div className="aspect-[4/5] rounded-2xl bg-black/5" />
                <div className="grid gap-2 p-5">
                  <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                    Featured
                  </div>
                  <div className="text-sm font-semibold">
                    Replace with your hero property / landscape image
                  </div>
                  <div className="text-sm text-muted">
                    A short line about what makes your place unforgettable.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="flex items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">
                What we offer
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Luxury rentals and curated farm sales
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted">
                Designed like a high-end property brand: clean layouts, strong
                imagery, and clear pathways to enquire.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Luxury Rentals",
                desc: "Short-stay accommodation with thoughtful, premium details.",
                href: "/rentals",
              },
              {
                title: "Livestock Sales",
                desc: "Limited numbers, transparent details, and inspection options.",
                href: "/farm-sales",
              },
              {
                title: "Produce & Growing",
                desc: "Seasonal produce and small-batch offerings as available.",
                href: "/farm-sales",
              },
              {
                title: "Trees",
                desc: "Quality stock for landscaping, shelter belts, and orchards.",
                href: "/farm-sales",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-3xl border border-black/10 bg-surface p-6 transition hover:border-black/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold tracking-[0.12em] uppercase">
                      {item.title}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-1 text-sm text-muted-2 transition group-hover:text-foreground">
                    →
                  </div>
                </div>
                <div className="mt-6 aspect-[16/9] rounded-2xl bg-black/5" />
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 rounded-3xl border border-black/10 bg-surface p-8 md:grid-cols-12 md:p-12">
            <div className="md:col-span-5">
              <div className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">
                A considered approach
              </div>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight">
                Hospitality and farming, side by side.
              </h3>
            </div>
            <div className="md:col-span-7">
              <p className="text-sm leading-7 text-muted">
                Use this space to tell your story in an editorial tone: where
                you are, what you value, and how guests and buyers can engage
                with the farm. The goal is a luxury feel with practical clarity.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/about" className="btn btn-secondary">
                  About the farm
                </Link>
                <Link href="/contact" className="btn btn-primary">
                  Make an enquiry
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
