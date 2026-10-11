import Link from "next/link";

import { Container } from "@/components/Container";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Local cellar doors and bottle shops | Bello Marco Farm",
  description:
    "Bello Marco Farm does not sell alcohol. Guests order and pay a licensed cellar door or bottle shop directly. Delivery is after check-in, to the adult guest, with ID.",
  path: "/cellar-doors",
});

const LOCAL_FAVOURITES = [
  {
    name: "Scotchmans Hill",
    town: "Drysdale",
    description: "Halliday 5-star winery and the closest major cellar door to the farm.",
    href: "https://www.scotchmans.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Oakdene",
    town: "Wallington",
    description: "Halliday 5-star winery, with a restaurant and cellar door.",
    href: "https://www.oakdene.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Banks Road",
    town: "Marcus Hill",
    description: "Small family estate. Its own site states a Halliday 5-star rating.",
    href: "https://banksroad.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Jack Rabbit Vineyard",
    town: "Bellarine",
    description: "Cellar door and restaurant with bay views.",
    href: "https://www.jackrabbitvineyard.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Terindah Estate",
    town: "Bellarine",
    description: "Boutique cellar door with lunch and private tastings.",
    href: "https://www.terindahestate.com",
    delivery: "Contact for delivery",
  },
  {
    name: "Leura Park Estate",
    town: "Curlewis",
    description: "Cellar door a short drive from Drysdale.",
    href: "https://leuraparkestate.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Basils Farm",
    town: "Swan Bay",
    description: "Restaurant and vineyard set in landscaped gardens.",
    href: "https://www.basilsfarm.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Bellarine Distillery / The Whiskery",
    town: "Drysdale",
    description: "Local gin distillery, with tastings at the cellar door.",
    href: "https://www.bellarinedistillery.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Flying Brick Cider Co",
    town: "Wallington",
    description: "Cider house and restaurant.",
    href: "https://flyingbrickciderco.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Austin's Wines",
    town: "Sutherlands Creek",
    description: "Geelong cool-climate cellar door, about 40–45 minutes from Drysdale.",
    href: "https://austinswines.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Bellarine Estate",
    town: "Bellarine",
    description: "Cellar door with a garden setting.",
    href: "https://bellarineestate.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Noble Rot Wine Store & Bar",
    town: "Point Lonsdale",
    description: "Fine wine merchant and bar.",
    href: "https://noblerotwine.com.au",
    delivery: "Contact for delivery",
  },
  {
    name: "Barwon Heads Winestore",
    town: "Barwon Heads",
    description: "Independent wine store and bar.",
    href: "https://barwonheadswinestore.com.au",
    delivery: "Free delivery across the Bellarine and Geelong",
  },
] as const;

export default function CellarDoorsPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">Local favourites</p>
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

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LOCAL_FAVOURITES.map((place) => (
            <article key={place.name} className="flex flex-col rounded-2xl border border-black/10 bg-surface p-5">
              <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-muted">{place.town}</p>
              <h2 className="mt-2 text-lg font-semibold">{place.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{place.description}</p>
              <p className="mt-3 text-sm leading-6">{place.delivery}</p>
              <a
                href={place.href}
                className="mt-4 text-sm font-semibold underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                {place.href.replace(/^https?:\/\//, "")}
              </a>
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
