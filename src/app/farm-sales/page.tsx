import Link from "next/link";

import { Container } from "@/components/Container";
import { farmSalesData } from "@/data/listings";

export default function FarmSalesPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Honey, Wine, Oilve Oil, Produce & Plant Sales
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Bello Marco Farm is a family-run farm dedicated to producing high-quality, locally grown products. 
            Surrounded by natural countryside, the farm offers a variety of fresh and handcrafted goods including pure 
            local honey, small-batch wine, and premium olive oil. Our fields and gardens produce seasonal vegetables, fragrant herbs, and fresh fruit, while our nursery provides a range of healthy plants for home gardens. We also harvest quality hay to support local farming needs. At Bello Marco Farm, we focus on sustainable practices and authentic farm-to-table produce, bringing the best of the land directly to our community.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {farmSalesData.map((category) => (
            <section
              key={category.title}
              className="rounded-2xl border border-black/10 bg-surface p-6"
            >
              <h2 className="text-sm font-semibold tracking-[0.12em] uppercase">
                {category.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                {category.description}
              </p>
              <div className="mt-6 grid gap-3">
                {category.listings.map((listing) => (
                  <div key={listing.id} className="rounded-xl bg-black/5 p-4">
                    <div className="text-sm font-medium text-foreground">
                      {listing.name}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {listing.description}
                    </div>
                    {listing.price && (
                      <div className="mt-2 text-xs font-medium text-foreground">
                        {listing.price}
                      </div>
                    )}
                    {listing.availability && (
                      <div className="mt-1 text-xs text-muted">
                        {listing.availability}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
