import Link from "next/link";

import { BookingCalendar } from "@/components/BookingCalendar";
import { Container } from "@/components/Container";
import { PhotoGallery } from "@/components/PhotoGallery";
import { FactGrid, LevyNote, PhotoPlaceholder, RateTable } from "@/components/PhotoPlaceholder";
import { SitePhoto } from "@/components/SitePhoto";
import { VILLA_GALLERY, VILLA_HERO } from "@/lib/photos";
import {
  EARLY_LATE_FEE,
  formatAud,
  FROM_PRICES,
  PET_EXTRA,
  PET_FIRST,
  STAY_POLICIES,
  VILLA_EVENTS_DISPLAY,
  VILLA_ID,
  VILLA_SEASONS,
} from "@/lib/rates";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Villa Di Marco | Drysdale accommodation with heated pool | Bello Marco Farm",
  description:
    "Villa Di Marco at Drysdale: 4 bedrooms, up to 10 guests, and a pool and spa with solar-powered heating set to your temperature. Luxury farm stay on the Bellarine, from $980 a night.",
  path: "/villa-di-marco",
});

const policy = STAY_POLICIES[VILLA_ID];

export default function VillaPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">Bello Marco Farm · Main house</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Villa Di Marco</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          The main house on Murradoc Hill, the highest point on the Bellarine, with bay and Melbourne skyline
          views over a 76-acre farm. Your pool, your temperature: all-electric, solar-powered heating, set for
          your whole stay, all year, included.
        </p>
        <p className="mt-4 text-sm font-medium">From {formatAud(FROM_PRICES.villa)} / night · winter weeknights, then up through the peak</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="#availability" className="btn btn-primary">Book / check availability</a>
          <Link href="/the-estate" className="btn btn-secondary">Whole property as The Estate</Link>
        </div>

        <figure className="mt-10 overflow-hidden rounded-3xl">
          <SitePhoto
            photo={VILLA_HERO}
            priority
            sizes="(min-width: 1152px) 1088px, calc(100vw - 3rem)"
            className="h-auto w-full"
          />
          <figcaption className="sr-only">{VILLA_HERO.caption}</figcaption>
        </figure>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <PhotoPlaceholder label="Pool and spa" aspect="aspect-[4/3]" />
          <PhotoPlaceholder label="The house exterior" aspect="aspect-[4/3]" />
        </div>

        <div className="mt-12">
          <FactGrid
            facts={[
              { label: "Bedrooms", value: "4" },
              { label: "Guests", value: "8 in beds, plus 2 single fold-out sofa beds. Maximum 10." },
              { label: "Bathrooms", value: "3 full bathrooms" },
              { label: "Parking", value: "6 car parks" },
              { label: "Check-in / out", value: "2:00pm / 10:00am" },
              { label: "Pets", value: "Welcome, maximum 2. Please don't feed the farm animals." },
              { label: "Pool and spa", value: "Included, heated to the temperature you choose" },
              { label: "Garden", value: "Fully renovated landscaped garden on the 76-acre farm" },
              { label: "Welcome gift", value: "Estate olive oil" },
            ]}
          />
        </div>

        <section id="gallery" className="mt-16 scroll-mt-24">
          <h2 className="text-3xl font-semibold tracking-tight">The house, garden, and farm</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Interim photos of Villa Di Marco. Pool, spa, and exterior photography will follow.
          </p>
          <div className="mt-8">
            <PhotoGallery photos={VILLA_GALLERY} />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight">Published rates</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Weeknights are Sunday to Thursday. Weekends are Friday and Saturday. Heating is included.
            A rate saved for a single date replaces that night at checkout. Event dates below are the
            published 2026/27 periods. Christmas and New Year rates replace the December and January rates on those nights.
          </p>
          <div className="mt-6">
            <RateTable
              caption="Villa Di Marco seasonal rates"
              columns={["Period", "Sun–Thu", "Fri & Sat", "Minimum stay"]}
              rows={VILLA_SEASONS.map((row) => [row.label, row.weekday, row.weekend, row.min])}
            />
          </div>
          <div className="mt-6">
            <RateTable
              caption="Villa Di Marco event rates"
              columns={["Event", "Dates", "Nightly", "Minimum stay"]}
              rows={VILLA_EVENTS_DISPLAY.map((row) => [row.label, row.when, row.nightly, row.min])}
            />
          </div>
        </section>

        <section className="mt-12 max-w-2xl space-y-3 text-sm leading-6 text-muted">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Fees</h2>
          <p>Cleaning is {formatAud(policy.cleaning)} per stay.</p>
          <p>
            Rates include {policy.includedGuests} guests. Guests 9 and 10 are {formatAud(policy.extraGuestPerNight)} per
            person per night.
          </p>
          <p>
            Pets are {formatAud(PET_FIRST)} for the first pet and {formatAud(PET_EXTRA)} for a second, per stay.
            Maximum 2. Dogs on a lead near livestock, and please don&apos;t feed the farm animals.
          </p>
          <p>
            Early check-in or late check-out is {formatAud(EARLY_LATE_FEE)} each, only when there is no same-day
            turnover, and is confirmed separately.
          </p>
          <LevyNote />
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight">Check availability</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Choose your dates to see the stay total, including cleaning and any extra-guest or pet fees.
          </p>
          <div className="mt-8 max-w-xl">
            <BookingCalendar propertyId={VILLA_ID} propertyName="Villa Di Marco" />
          </div>
        </section>
      </Container>
    </div>
  );
}
