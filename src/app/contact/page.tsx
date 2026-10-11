import { Container } from "@/components/Container";
import { EnquiryForm } from "@/components/EnquiryForm";
import { ADDRESS_LINE, EMAIL, pageMeta, PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

export const metadata = pageMeta({
  title: "Contact Bello Marco Farm | Luxury farm stay, Drysdale",
  description:
    "Enquire about Villa Di Marco, La Stalla or The Estate at Bello Marco Farm, 275 Founds Road, Drysdale, on the Bellarine Peninsula.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Contact</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Ask about a stay, a buyout, the pantry, or an experience. For Villa Di Marco and La Stalla you can
              also check dates and pay on their pages.
            </p>
            <div className="mt-10 space-y-4 rounded-2xl border border-black/10 bg-surface p-6 text-sm">
              <div>
                <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">Visit</div>
                <p className="mt-1">{ADDRESS_LINE}</p>
                <p className="mt-1 text-muted">Bellarine Peninsula, Victoria</p>
              </div>
              <div>
                <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">Email</div>
                <a className="mt-1 inline-block underline underline-offset-2" href={`mailto:${EMAIL}`}>
                  {EMAIL}
                </a>
              </div>
              <div>
                <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">Phone</div>
                <a className="mt-1 inline-block underline underline-offset-2" href={`tel:${PHONE_TEL}`}>
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </div>
          <EnquiryForm
            idPrefix="contact"
            defaultTopic="villa"
            topics={[
              { value: "villa", label: "Villa Di Marco" },
              { value: "stalla", label: "La Stalla" },
              { value: "estate", label: "The Estate" },
              { value: "experiences", label: "Experiences" },
              { value: "pantry", label: "Pantry / pre-arrival store" },
              { value: "events", label: "Events and celebrations" },
              { value: "farm", label: "The Farm" },
              { value: "other", label: "Something else" },
            ]}
          />
        </div>
      </Container>
    </div>
  );
}
