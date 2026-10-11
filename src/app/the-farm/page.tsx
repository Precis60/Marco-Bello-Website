import Link from "next/link";

import { Container } from "@/components/Container";
import { FactGrid, PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "The Farm | 76 acres on Murradoc Hill, Bellarine | Bello Marco Farm",
  description:
    "Bello Marco Farm is 76 acres on Murradoc Hill, the highest point on the Bellarine Peninsula, at 275 Founds Road, Drysdale. Bay and Melbourne skyline views, and a fully renovated landscaped garden.",
  path: "/the-farm",
});

export default function FarmPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">275 Founds Road, Drysdale</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">The Farm</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          Bello Marco Farm is 76 acres on Murradoc Hill, which the planning scheme calls the highest point on the
          Bellarine Peninsula. From the guest precinct you look toward the bay and the Melbourne skyline. Geelong
          is about 25 minutes away, and Melbourne about an hour and twenty.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <PhotoPlaceholder label="The 76-acre farm from the hill" aspect="aspect-[4/3]" />
          <PhotoPlaceholder label="The landscaped garden" aspect="aspect-[4/3]" />
        </div>

        <div className="mt-10">
          <FactGrid
            facts={[
              { label: "Land", value: "76 acres on Murradoc Hill, Drysdale VIC 3222" },
              { label: "Views", value: "Bay and Melbourne skyline" },
              { label: "Garden", value: "The landscaped garden has been fully renovated" },
              { label: "Animals", value: "Please don't feed the farm animals. Dogs on a lead near livestock." },
              { label: "Welcome gift", value: "Estate olive oil for staying guests." },
              { label: "Merlot", value: "Coming 2029. Not for sale." },
            ]}
          />
        </div>

        <div className="mt-12 max-w-2xl space-y-4 text-sm leading-7 text-muted">
          <p>
            The guest part of the farm is the house, La Stalla, the pool and spa, and the garden. Beyond that are
            the paddocks. Guests are welcome to enjoy the garden and the outlook. Feeding animals, and letting dogs
            off lead near stock, is not.
          </p>
          <p>
            A guided walk can be requested on the{" "}
            <Link href="/experiences" className="underline underline-offset-2 hover:text-foreground">
              experiences
            </Link>{" "}
            page. Food for the fridge is on the{" "}
            <Link href="/pantry" className="underline underline-offset-2 hover:text-foreground">
              pantry
            </Link>
            .
          </p>
          <p>
            Villa Di Marco is the stay to book if you want the pool. La Stalla is the front unit. The Estate is both.
          </p>
        </div>

        <div className="mt-8">
          <PhotoPlaceholder label="Paddocks and farm animals — photography still to be taken" />
        </div>
      </Container>
    </div>
  );
}
