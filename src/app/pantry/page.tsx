import Link from "next/link";

import { Container } from "@/components/Container";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { PANTRY_RULES } from "@/lib/catalogue";
import { formatAud } from "@/lib/rates";
import { pageMeta } from "@/lib/site";

import { PantryShop } from "./PantryShop";

export const metadata = pageMeta({
  title: "Pantry | Pre-arrival store for your farm stay | Bello Marco Farm",
  description:
    "Food-only pre-arrival store for Bello Marco Farm, Drysdale. Hampers, breakfast and BBQ packs, and local produce stocked in the fridge. The welcome gift is estate olive oil.",
  path: "/pantry",
});

export default function PantryPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">Pre-arrival store</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Pantry</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          This pre-arrival store is food only. Order ahead and we stock the fridge before check-in. Prices are
          indicative from-prices. The pantry is requested and paid separately from your stay.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          The welcome gift with the stay is estate olive oil. Licensed retailers are listed on{" "}
          <Link href="/cellar-doors" className="underline underline-offset-2 hover:text-foreground">
            local cellar doors and bottle shops
          </Link>
          . You order and pay them yourself.
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
          <PhotoPlaceholder label="Fridge stocking and a food hamper" />
        </div>

        <div className="mt-12">
          <PantryShop />
        </div>
      </Container>
    </div>
  );
}
