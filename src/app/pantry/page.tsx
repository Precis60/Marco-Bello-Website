import { Container } from "@/components/Container";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { PANTRY_RULES } from "@/lib/catalogue";
import { formatAud } from "@/lib/rates";
import { pageMeta } from "@/lib/site";

import { PantryShop } from "./PantryShop";

export const metadata = pageMeta({
  title: "Pantry | Pre-arrival store for your farm stay | Bello Marco Farm",
  description:
    "Order food and drinks before you arrive at Bello Marco Farm, Drysdale. Hampers, breakfast and BBQ packs, and local produce stocked in the fridge. Alcohol is delivered by a licensed partner, not sold by us.",
  path: "/pantry",
});

export default function PantryPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">Pre-arrival store</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Pantry</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          Order food ahead and we stock the fridge before check-in. Prices are indicative from-prices. The pantry
          is requested and paid separately from your stay — nothing here is added to the accommodation checkout.
        </p>
        <ul className="mt-6 max-w-2xl space-y-2 text-sm leading-6 text-muted">
          <li>{PANTRY_RULES.cutoff}</li>
          <li>{formatAud(PANTRY_RULES.minimum)} minimum order.</li>
          <li>
            {formatAud(PANTRY_RULES.stockingFee)} stocking fee, waived when the order is{" "}
            {formatAud(PANTRY_RULES.stockingWaivedOver)} or more.
          </li>
        </ul>
        <div className="mt-8">
          <PhotoPlaceholder label="Fridge stocking and a welcome hamper" />
        </div>

        <div className="mt-12">
          <PantryShop />
        </div>

        <section className="mt-16 max-w-2xl rounded-2xl border border-black/10 bg-surface p-6">
          <h2 className="text-2xl font-semibold tracking-tight">Wine and beer</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Wine and beer are delivered by our licensed local partner. Bello Marco Farm does not sell alcohol.
          </p>
          <p className="mt-4 text-sm font-medium">Licensed local partner link — to be confirmed.</p>
          <p className="mt-2 text-xs leading-5 text-muted">
            Placeholder only. The partner&apos;s name and web address are not published yet. Ask in your enquiry and
            we will send the current details.
          </p>
        </section>
      </Container>
    </div>
  );
}
