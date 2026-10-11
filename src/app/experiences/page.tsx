import Link from "next/link";

import { Container } from "@/components/Container";
import { EnquiryForm } from "@/components/EnquiryForm";
import { IndicativeTag, PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { CHEF_MENUS, OTHER_ADD_ONS, SERVICE_OFFERS, type PricedOffer } from "@/lib/catalogue";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Experiences | Private chef and farm stay add-ons | Bello Marco Farm",
  description:
    "Private chef, waitstaff and an in-house host for guests at Bello Marco Farm, Drysdale. Indicative from-prices. Booked and paid separately from the stay.",
  path: "/experiences",
});

function OfferCard({ offer }: { offer: PricedOffer }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">{offer.name}</h3>
        <IndicativeTag />
      </div>
      <p className="mt-2 text-sm font-medium">{offer.priceLabel}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{offer.detail}</p>
    </article>
  );
}

export default function ExperiencesPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">For staying guests</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Experiences</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          A private chef and waitstaff with local staff, an optional in-house host from 12pm to 8pm, and a short
          list of other add-ons. Every price below is indicative — a from-price — and is confirmed before you pay.
          Experiences are booked and paid separately from the stay.
        </p>
        <div className="mt-8">
          <PhotoPlaceholder label="A table set for a private dinner at the house" />
        </div>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight">Private chef</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Menus are cooked for your group by local chefs. The from-price is per person, and each menu has a
            minimum spend.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {CHEF_MENUS.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight">Waitstaff and in-house host</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Waitstaff start at a four-hour minimum. The in-house host is a local helper on site from 12pm to 8pm.
            Please give 72 hours&apos; notice for the host.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {SERVICE_OFFERS.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight">Other add-ons</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Hampers and fridge stocking are on the{" "}
            <Link href="/pantry" className="underline underline-offset-2">pantry</Link>.
            The rest are on request, and only go ahead when the partner and the date are free. None of these are
            a wedding or public-function service.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {OTHER_ADD_ONS.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Request an experience</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Send the dates, how many people, and which menu or service you want. We reply with a confirmed price.
              Payment is separate from your accommodation.
            </p>
          </div>
          <EnquiryForm
            idPrefix="experiences"
            defaultTopic="chef"
            submitLabel="Request this experience"
            extraNote="Add-ons are not added to a stay checkout."
            topics={[
              { value: "chef", label: "Private chef" },
              { value: "waitstaff", label: "Waitstaff" },
              { value: "host", label: "In-house host, 12pm–8pm" },
              { value: "addon", label: "Another add-on" },
              { value: "corporate", label: "Corporate retreat add-ons" },
            ]}
          />
        </section>
      </Container>
    </div>
  );
}
