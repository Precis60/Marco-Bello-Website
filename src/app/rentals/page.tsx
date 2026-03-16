import Link from "next/link";

import { Container } from "@/components/Container";

export default function RentalsPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Peaceful Holiday Retreats
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Nestled in the scenic countryside of Drysdale, Bello Marco Farm offers two unique stays surrounded by 
            vineyards and farm charm. The Main House provides a spacious, comfortable retreat perfect for families and 
            groups, while the Vineyard & Hobby Farm Tiny Home offers a cozy, peaceful escape overlooking rolling vines 
            and gardens. Guests can explore the property, enjoy local produce, and experience the quiet beauty of rural 
            life, all just moments from the Bellarine Peninsula’s attractions.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              name: "The Main House",
              blurb: "A considered, high-comfort stay with sweeping views.",
            },
            {
              name: "Vineyard - Tiny Home",
              blurb: "Quiet, warm interiors with an orchard outlook.",
            },
            {
              name: "Hobby Farm - Tiny Home",
              blurb: "Minimal luxury — perfect for weekends and events.",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-black/10 bg-surface p-6"
            >
              <div className="text-sm font-semibold tracking-[0.12em] uppercase">
                {item.name}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{item.blurb}</p>
              <div className="mt-6 h-40 rounded-xl bg-black/5" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
