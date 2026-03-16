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
            Tell the story of your land, your approach to hospitality, and how
            you raise and grow what you sell.
          </p>
          <div className="mt-10 space-y-6 rounded-2xl border border-black/10 bg-surface p-6">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                Luxury rentals
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                A quiet, refined rural experience with thoughtful details.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                Farm sales
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                Livestock, produce, and trees offered in season and in limited
                numbers.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
