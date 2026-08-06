import Link from "next/link";

import { Container } from "@/components/Container";

export default function BookingSuccessPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Booking confirmed
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Thank you — your payment was successful and your stay is booked.
            A confirmation will be sent to your email shortly. If you have
            any questions in the meantime, feel free to get in touch.
          </p>
          <Link href="/rentals" className="btn btn-primary mt-8 inline-flex">
            Back to rentals
          </Link>
        </div>
      </Container>
    </div>
  );
}
