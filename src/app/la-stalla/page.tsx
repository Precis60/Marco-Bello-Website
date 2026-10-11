import Link from "next/link";

import { BookingCalendar } from "@/components/BookingCalendar";
import { Container } from "@/components/Container";
import { FactGrid, LevyNote, PhotoPlaceholder, RateTable } from "@/components/PhotoPlaceholder";
import { formatAud, FROM_PRICES, STALLA_ID, STALLA_SEASONS, STAY_POLICIES } from "@/lib/rates";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "La Stalla | 2-bedroom farm stay in Drysdale | Bello Marco Farm",
  description:
    "La Stalla is the front unit at Bello Marco Farm, Drysdale: 2 bedrooms, 1 bathroom, sleeps 6, with 3 car parks. From $210 a night on the Bellarine.",
  path: "/la-stalla",
});

const policy = STAY_POLICIES[STALLA_ID];

export default function LaStallaPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">Bello Marco Farm · Front unit</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">La Stalla</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          La Stalla is the existing front unit at 275 Founds Road: a 2-bedroom, 1-bathroom stay that sleeps 6,
          with 3 car parks, on the same 76-acre farm as Villa Di Marco.
        </p>
        <p className="mt-4 text-sm font-medium">From {formatAud(FROM_PRICES.stalla)} / night in winter.</p>
        <div className="mt-8">
          <PhotoPlaceholder label="La Stalla, the front unit" aspect="aspect-[16/8]" />
        </div>

        <div className="mt-10">
          <FactGrid
            facts={[
              { label: "Bedrooms", value: "2" },
              { label: "Bathroom", value: "1" },
              { label: "Guests", value: "Sleeps 6" },
              { label: "Parking", value: "3 car parks" },
              { label: "Check-in / out", value: "2:00pm / 10:00am" },
              { label: "Pool and spa", value: "With The Estate buyout, not with La Stalla on its own" },
            ]}
          />
        </div>

        <div className="mt-10 max-w-2xl space-y-4 text-sm leading-6 text-muted">
          <p>
            The pool and spa belong with Villa Di Marco. Book La Stalla on its own for the unit. Book{" "}
            <Link href="/the-estate" className="underline underline-offset-2 hover:text-foreground">
              The Estate
            </Link>{" "}
            when the group wants both stays and the pool.
          </p>
          <p>
            Pets are welcome in Villa Di Marco. If you are travelling with a pet and want La Stalla as well, ask
            us when you enquire about The Estate.
          </p>
        </div>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight">Published rates</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Weeknights are Sunday to Thursday. Weekends are Friday and Saturday. Premium event dates follow the
            same 2026/27 weekends published for the house, at the unit&apos;s event rate.
          </p>
          <div className="mt-6">
            <RateTable
              caption="La Stalla seasonal rates"
              columns={["Season", "Sun–Thu", "Fri & Sat", "Minimum stay"]}
              rows={STALLA_SEASONS.map((row) => [row.label, row.weekday, row.weekend, row.min])}
            />
          </div>
        </section>

        <section className="mt-12 max-w-2xl space-y-3 text-sm leading-6 text-muted">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Fees</h2>
          <p>Cleaning is {formatAud(policy.cleaning)} per stay. The rate is for up to 6 guests.</p>
          <LevyNote />
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight">Check availability</h2>
          <div className="mt-8 max-w-xl">
            <BookingCalendar propertyId={STALLA_ID} propertyName="La Stalla" />
          </div>
        </section>
      </Container>
    </div>
  );
}
