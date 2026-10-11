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
            Thank you. Your payment was successful and your stay is booked.
            A confirmation will be sent to your email. Pool and spa temperature
            requests are confirmed before you arrive. The Victorian 7.5% short
            stay levy, if it applies, is not part of the amount you just paid.
          </p>
          <Link href="/villa-di-marco" className="btn btn-primary mt-8 inline-flex">
            Back to Villa Di Marco
          </Link>
        </div>
      </Container>
    </div>
  );
}
