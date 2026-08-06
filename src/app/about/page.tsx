import { Container } from "@/components/Container";

export default function AboutPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            About
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Bello Marco Farm is a family-run property on the Bellarine
            Peninsula, dedicated to sustainable, small-scale farming and
            genuine hospitality. We grow vegetables, herbs, fruit, and hay,
            produce honey, wine, and olive oil, and raise a select range of
            plants and trees for local gardens.
          </p>
          <div className="mt-10 space-y-6 rounded-2xl border border-black/10 bg-surface p-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                Luxury rentals
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                Two holiday stays set among vineyards and gardens, just moments
                from the Bellarine Peninsula's beaches and towns.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                Farm sales
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                Honey, wine, olive oil, seasonal produce, and plants offered in
                small, seasonal quantities to local customers.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
