import { Container } from "@/components/Container";
import { EnquiryForm } from "@/components/EnquiryForm";
import { PhotoPlaceholder } from "@/components/PhotoPlaceholder";
import { pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Events and celebrations for staying guests | Bello Marco Farm",
  description:
    "Celebrations for guests staying at Bello Marco Farm, Drysdale, and enquiries for midweek corporate retreats. Weddings and public functions are not offered.",
  path: "/events",
});

export default function EventsPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted">Staying guests</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Events and celebrations
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
          We host celebrations for the people staying at Bello Marco Farm: up to 10 in Villa Di Marco, or up to 16
          when you take The Estate. A birthday, a proposal, or a long lunch with your own group belongs here.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <PhotoPlaceholder label="A celebration table in the garden" />
          <PhotoPlaceholder label="The house set for a staying group" />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-black/10 bg-surface p-6">
            <h2 className="text-xl font-semibold tracking-tight">Celebrations</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              For guests who are already staying. We can talk through a simple set-up, a private chef, or waitstaff.
              Those extras are requested on the experiences page and paid separately from the stay.
            </p>
          </section>
          <section className="rounded-2xl border border-black/10 bg-surface p-6">
            <h2 className="text-xl font-semibold tracking-tight">Corporate retreats</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Midweek Estate buyouts from May to September can be quoted as a package, with catering arranged
              separately. Tell us the dates and how many people are coming.
            </p>
          </section>
        </div>

        <p className="mt-8 max-w-2xl rounded-2xl border border-dashed border-black/20 p-5 text-sm leading-6 text-muted">
          We are not taking weddings, or functions for guests who are not staying. Those uses need a council permit
          that is not in place. This page is an enquiry for staying groups only.
        </p>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Send an enquiry</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Include your stay dates, the number of people sleeping here, and what you would like to mark. We
              will say whether the dates are free before anything is booked.
            </p>
          </div>
          <EnquiryForm
            idPrefix="events"
            defaultTopic="celebration"
            topics={[
              { value: "celebration", label: "Celebration for staying guests" },
              { value: "corporate", label: "Corporate retreat" },
              { value: "other", label: "Something else for our group" },
            ]}
          />
        </section>
      </Container>
    </div>
  );
}
