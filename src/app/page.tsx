import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { FactGrid, PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { FROM_PRICES, formatAud, LEVY_NOTE } from "@/lib/rates";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: "Bellarine luxury farm stay with heated pool and spa | Bello Marco Farm, Drysdale",
  },
  description:
    "Luxury farm stay on Murradoc Hill, Drysdale. Villa Di Marco sleeps 10, with a pool and spa on solar-powered heating set to your temperature, all year, included.",
  keywords: [
    "luxury farm stay Bellarine",
    "Drysdale accommodation with heated pool",
    "Bello Marco Farm",
    "Villa Di Marco",
    "Bellarine Peninsula farm stay",
    "Murradoc Hill",
  ],
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title: "Bellarine luxury farm stay with heated pool and spa | Bello Marco Farm",
    description:
      "Villa Di Marco on a 76-acre farm at Drysdale. Your pool, your temperature — solar-powered heating, all year, included.",
    url: absoluteUrl("/"),
    type: "website",
    siteName: "Bello Marco Farm",
    locale: "en_AU",
  },
};

const VILLA_FACTS = [
  { label: "Bedrooms", value: "4" },
  { label: "Guests", value: "8 in beds, plus 2 single fold-out sofa beds (maximum 10)" },
  { label: "Bathrooms", value: "3 full bathrooms" },
  { label: "Parking", value: "6 car parks" },
  { label: "Check-in", value: "2:00pm" },
  { label: "Check-out", value: "10:00am" },
  { label: "Pets", value: "Welcome. Please don't feed the farm animals." },
  { label: "Welcome gift", value: "Estate olive oil" },
  { label: "Pool and spa", value: "Heated to your temperature for the whole stay, included" },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_520px_at_20%_0%,rgba(31,58,46,0.14),transparent_60%),radial-gradient(800px_420px_at_90%_20%,rgba(176,141,87,0.16),transparent_55%)]" />
        <Container className="relative py-16 sm:py-24">
          <div className="grid items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">
                Bello Marco Farm · Drysdale, Bellarine Peninsula
              </p>
              <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl">
                Your pool, your temperature
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted">
                Villa Di Marco is a luxury farm stay on Murradoc Hill, the highest point on the Bellarine,
                with bay and Melbourne skyline views across 76 acres. The pool and spa use all-electric,
                solar-powered heating, set to the temperature you choose for the whole stay, all year, included.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/villa-di-marco#availability" className="btn btn-primary">
                  Book Villa Di Marco
                </Link>
                <Link href="/villa-di-marco#availability" className="btn btn-secondary">
                  Check availability
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted">From {formatAud(FROM_PRICES.villa)} / night in winter.</p>
            </div>
            <div className="lg:col-span-5">
              <PhotoPlaceholder label="Pool and spa, with the view from Murradoc Hill" aspect="aspect-[4/5]" />
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">Villa Di Marco</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">The main house</h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              Four bedrooms and three full bathrooms. Eight guests in beds, plus two single fold-out sofa beds,
              so the house sleeps ten. Six car parks. The landscaped garden has been fully renovated. The house
              looks over the farm from the top of the Bellarine.
            </p>
          </div>
          <div className="mt-8">
            <FactGrid facts={VILLA_FACTS} />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <PhotoPlaceholder label="Villa Di Marco living rooms and garden" />
            <PhotoPlaceholder label="Bay and Melbourne skyline from the hill" />
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="grid gap-8 rounded-3xl border border-black/10 bg-surface p-8 md:grid-cols-12 md:p-12">
            <div className="md:col-span-5">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">The pool and spa</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Set for your stay</h2>
            </div>
            <div className="md:col-span-7 text-sm leading-7 text-muted">
              <p>
                Tell us the temperature you want. We set the all-electric, solar-powered heating before you
                arrive and leave it there for the whole stay. It is included — there is no energy surcharge.
                Heating runs all year, so the pool and spa are part of a winter stay as much as a summer one.
              </p>
              <p className="mt-4">Swim in July. The heat is solar-powered heating, included with Villa Di Marco and with The Estate.</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <h2 className="text-3xl font-semibold tracking-tight">Three ways to stay</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {[
              {
                href: "/villa-di-marco",
                title: "Villa Di Marco",
                price: `From ${formatAud(FROM_PRICES.villa)} / night`,
                text: "The main house for up to 10 guests, with the pool and spa.",
              },
              {
                href: "/la-stalla",
                title: "La Stalla",
                price: `From ${formatAud(FROM_PRICES.stalla)} / night`,
                text: "The front unit. Two bedrooms, one bathroom, sleeps 6, with 3 car parks.",
              },
              {
                href: "/the-estate",
                title: "The Estate",
                price: `From ${formatAud(FROM_PRICES.estate)} / night`,
                text: "Both stays together, for up to 16 guests. Pool and spa for the whole group.",
              },
            ].map((stay) => (
              <Link
                key={stay.href}
                href={stay.href}
                className="rounded-3xl border border-black/10 bg-surface p-6 transition hover:border-black/20"
              >
                <div className="text-xs font-semibold tracking-[0.16em] uppercase text-muted">{stay.price}</div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{stay.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{stay.text}</p>
                <div className="mt-6 text-sm font-semibold">View stay →</div>
              </Link>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-muted">{LEVY_NOTE}</p>
        </Container>
      </section>
    </div>
  );
}
