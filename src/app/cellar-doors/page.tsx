import Link from "next/link";

import { Container } from "@/components/Container";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Local cellar doors and bottle shops | Bello Marco Farm",
  description:
    "Bello Marco Farm does not sell alcohol. Guests order and pay a licensed cellar door or bottle shop directly. Delivery is after check-in, to the adult guest, with ID.",
  path: "/cellar-doors",
});

const PLACEHOLDERS = [
  {
    title: "Cellar door",
    detail: "Licensed local cellar door. Name, address and link are still to be confirmed.",
  },
  {
    title: "Bottle shop",
    detail: "Licensed local bottle shop. Name, address and link are still to be confirmed.",
  },
  {
    title: "Second cellar door",
    detail: "A second licensed partner, if we add one. Name, address and link are still to be confirmed.",
  },
];

export default function CellarDoorsPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">Licensed retailers</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Local cellar doors &amp; bottle shops
        </h1>
        <div className="mt-5 max-w-2xl space-y-4 text-base leading-7 text-muted">
          <p>
            Bello Marco Farm does not sell alcohol. It is not part of the pantry, a hamper, or a chef menu, and it
            is not included with the stay.
          </p>
          <p>
            You order and pay the retailer directly. Alcohol is delivered after check-in to the adult guest, who
            needs photo ID.
          </p>
          <p>
            Private chef dinners are BYO, or you order drinks from one of these retailers for that same delivery.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLACEHOLDERS.map((partner) => (
            <article key={partner.title} className="rounded-2xl border border-dashed border-black/20 bg-surface p-5">
              <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-muted">Placeholder</p>
              <h2 className="mt-3 text-lg font-semibold">{partner.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{partner.detail}</p>
              <p className="mt-4 text-sm font-medium">Link to be confirmed</p>
            </article>
          ))}
        </div>

        <p className="mt-10 max-w-2xl text-sm leading-6 text-muted">
          Food for the fridge is on the{" "}
          <Link href="/pantry" className="underline underline-offset-2 hover:text-foreground">
            pantry
          </Link>
          . That store is food only. A driver to a cellar door can be requested on{" "}
          <Link href="/experiences" className="underline underline-offset-2 hover:text-foreground">
            experiences
          </Link>
          . You still pay the venue yourself.
        </p>
      </Container>
    </div>
  );
}
