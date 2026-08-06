import Link from "next/link";

import { Container } from "@/components/Container";

export default function BookingCancelPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Booking cancelled
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Your payment was not completed and you have not been charged.
            You're welcome to choose new dates and try again.
          </p>
          <Link href="/rentals" className="btn btn-primary mt-8 inline-flex">
            Back to rentals
          </Link>
        </div>
      </Container>
    </div>
  );
}
