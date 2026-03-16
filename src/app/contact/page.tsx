import { Container } from "@/components/Container";

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Form submission is not yet implemented. Please contact us directly via email or phone.');
  };

  return (
    <div className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-12 md:grid-cols-2">
          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Enquire
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              Send a short note and I'll reply with availability, pricing, and
              next steps.
            </p>

            <div className="mt-10 space-y-3 rounded-2xl border border-black/10 bg-surface p-6 text-sm">
              <div>
                <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                  Email
                </div>
                <div className="mt-1">admin@bellomarco.com.au</div>
              </div>
              <div>
                <div className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                  Phone
                </div>
                <div className="mt-1">0413 729 663</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-black/10 bg-surface p-6">
            <div className="grid gap-4">
              <div>
                <label htmlFor="name" className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                  Name
                </label>
                <input id="name" className="input" name="name" required />
              </div>
              <div>
                <label htmlFor="email" className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                  Email
                </label>
                <input id="email" className="input" name="email" type="email" required />
              </div>
              <div>
                <label htmlFor="topic" className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                  What are you enquiring about?
                </label>
                <select id="topic" className="input" name="topic" defaultValue="rentals" required>
                  <option value="rentals">Luxury rentals</option>
                  <option value="livestock">Livestock sales</option>
                  <option value="produce">Produce sales</option>
                  <option value="trees">Tree sales</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                  Message
                </label>
                <textarea id="message" className="input min-h-32" name="message" required />
              </div>

              <button type="submit" className="btn btn-primary">
                Send enquiry
              </button>
              <p className="text-xs text-muted">
                This form is currently static. Next step is wiring it to email
                or a CRM.
              </p>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}
