import Link from "next/link";

import { Container } from "@/components/Container";
import { EnquiryForm } from "@/components/EnquiryForm";
import { FactGrid, LevyNote, PhotoPlaceholder, RateTable } from "@/components/PhotoPlaceholder";
import { SitePhoto } from "@/components/SitePhoto";
import { ESTATE_FARM_HERO, ESTATE_PHOTOS, PADDOCK_SUNSET } from "@/lib/photos";
import { ESTATE_CLEANING, ESTATE_SEASONS, formatAud, FROM_PRICES } from "@/lib/rates";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "The Estate | Whole-property farm stay for groups | Bello Marco Farm",
  description:
    "The Estate is exclusive use of Villa Di Marco and La Stalla at Drysdale, for up to 16 guests, with the heated pool and spa. From $1,350 a night.",
  path: "/the-estate",
});

export default function EstatePage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">Whole-property buyout</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">The Estate</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          The Estate is Villa Di Marco and La Stalla together: exclusive use of both stays, for up to 16 guests.
          The pool and spa, with solar-powered heating set to your group&apos;s temperature, are included for the
          whole stay.
        </p>
        <p className="mt-4 text-sm font-medium">
          From {formatAud(FROM_PRICES.estate)} / night in winter. Groups, celebrations for guests who are staying,
          and midweek corporate retreats.
        </p>

        <figure className="mt-8 overflow-hidden rounded-3xl">
          <SitePhoto
            photo={ESTATE_FARM_HERO}
            priority
            sizes="(min-width: 1152px) 1088px, calc(100vw - 3rem)"
            className="h-auto w-full"
          />
          <figcaption className="mt-2 text-sm text-muted">{ESTATE_FARM_HERO.caption}</figcaption>
        </figure>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ESTATE_PHOTOS.map((photo) => (
            <li key={photo.id}>
              <figure>
                <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-black/5">
                  <SitePhoto
                    photo={photo}
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                    fill
                    className="object-cover object-center"
                  />
                </span>
                <figcaption className="mt-2 text-sm text-muted">{photo.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <PhotoPlaceholder label="La Stalla and the pool" aspect="aspect-[16/8]" />
        </div>

        <div className="mt-10">
          <FactGrid
            facts={[
              { label: "What you book", value: "Villa Di Marco and La Stalla, exclusive use" },
              { label: "Guests", value: "14 in beds, up to 16 with the sofa beds" },
              { label: "Pool and spa", value: "For the whole group, heated to your temperature, included" },
              { label: "Parking", value: "6 car parks at the house and 3 at La Stalla" },
              { label: "Check-in / out", value: "2:00pm / 10:00am" },
              { label: "Cleaning", value: `${formatAud(ESTATE_CLEANING)} per stay` },
            ]}
          />
        </div>

        <section className="mt-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">76 acres of open paddock</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Villa Di Marco and La Stalla share the same farm. Past the house and the garden, the land is open paddock.
            </p>
          </div>
          <figure className="mt-8 overflow-hidden rounded-3xl">
            <SitePhoto
              photo={PADDOCK_SUNSET}
              sizes="(min-width: 1152px) 1088px, calc(100vw - 3rem)"
              className="h-auto w-full"
            />
            <figcaption className="mt-2 text-sm text-muted">{PADDOCK_SUNSET.caption}</figcaption>
          </figure>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight">Published rates</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            These are the buyout rates for both stays. A May–September midweek corporate package is quoted from
            $1,600 to $2,000 a night, catering separate. Prices are indicative until we confirm the dates.
          </p>
          <div className="mt-6">
            <RateTable
              caption="The Estate buyout rates"
              columns={["Season", "Sun–Thu", "Fri & Sat", "Minimum stay"]}
              rows={ESTATE_SEASONS.map((row) => [row.label, row.weekday, row.weekend, row.min])}
            />
          </div>
          <div className="mt-6 max-w-2xl">
            <LevyNote />
            <p className="mt-3 text-sm leading-6 text-muted">
              The Estate is confirmed by enquiry so both calendars can be held together. Online checkout for the
              house and La Stalla separately is on their own pages:{" "}
              <Link href="/villa-di-marco" className="underline underline-offset-2">Villa Di Marco</Link>
              {" "}and{" "}
              <Link href="/la-stalla" className="underline underline-offset-2">La Stalla</Link>.
            </p>
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Enquire</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Tell us the dates, the size of the group, and whether you want a celebration for the people staying,
              or a midweek corporate retreat. We reply with availability and the total, including cleaning.
            </p>
          </div>
          <EnquiryForm
            idPrefix="estate"
            defaultTopic="buyout"
            topics={[
              { value: "buyout", label: "The Estate — whole property" },
              { value: "corporate", label: "Corporate midweek (May–September)" },
              { value: "celebration", label: "Celebration for staying guests" },
            ]}
          />
        </section>
      </Container>
    </div>
  );
}
