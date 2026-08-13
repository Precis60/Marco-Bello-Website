import Link from "next/link";

import { BookingCalendar } from "@/components/BookingCalendar";
import { Container } from "@/components/Container";
import { properties } from "@/lib/properties";

export default function RentalsPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Peaceful Holiday Retreats
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Nestled in the scenic countryside of Drysdale, Bello Marco Farm offers two unique stays surrounded by 
            vineyards and farm charm. The Main House - Villa Di Marco provides a spacious, comfortable retreat perfect 
            for families and groups, while Tiny Home - La Stalla offers a cozy, peaceful escape overlooking rolling 
            vines and gardens. Guests can explore the property, enjoy local produce, and experience the quiet beauty of 
            rural life, all just moments from the Bellarine Peninsula’s attractions.{" "}
            <Link href="/contact" className="underline underline-offset-2 hover:text-foreground">
              get in touch
            </Link>{" "}
            or call{" "}
            <a href="tel:+61413729663" className="underline underline-offset-2 hover:text-foreground">
              0413 729 663
            </a>.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {Object.values(properties).map((item) => (
            <div
              key={item.id}
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

        <div className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Check availability & book
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Select your dates below to see live availability and pay securely
            online. The Main House - Villa Di Marco and Tiny Home - La Stalla
            each have their own calendar and are booked separately.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <BookingCalendar
              propertyId={properties["main-house"].id}
              propertyName={properties["main-house"].name}
              nightlyPrice={properties["main-house"].nightlyPrice}
              minNights={properties["main-house"].minNights}
            />
            <BookingCalendar
              propertyId={properties["vineyard-tiny-home"].id}
              propertyName={properties["vineyard-tiny-home"].name}
              nightlyPrice={properties["vineyard-tiny-home"].nightlyPrice}
              minNights={properties["vineyard-tiny-home"].minNights}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
