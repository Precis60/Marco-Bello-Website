"use client";

import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { DayPicker, type DateRange, type Matcher } from "react-day-picker";
import "react-day-picker/style.css";

interface BookedRange {
  start_date: string;
  end_date: string;
}

interface BookingCalendarProps {
  propertyId: string;
  propertyName: string;
  nightlyPrice: number;
  minNights: number;
}

export function BookingCalendar({
  propertyId,
  propertyName,
  nightlyPrice,
  minNights,
}: BookingCalendarProps) {
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [range, setRange] = useState<DateRange | undefined>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/availability?propertyId=${propertyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setBookedRanges(data.ranges ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't load availability. Please try again shortly.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const disabledDays = useMemo<Matcher[]>(() => {
    const today = startOfDay(new Date());
    return [
      { before: today },
      ...bookedRanges.map((r) => ({
        from: new Date(r.start_date),
        // end_date is the checkout day (exclusive), so the last blocked night is one day before it.
        to: new Date(new Date(r.end_date).getTime() - 24 * 60 * 60 * 1000),
      })),
    ];
  }, [bookedRanges]);

  const nights = range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) : 0;
  const total = nights * nightlyPrice;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!range?.from || !range?.to) {
      setError("Please select check-in and check-out dates.");
      return;
    }
    if (nights < minNights) {
      setError(`Minimum stay is ${minNights} nights.`);
      return;
    }
    if (!name || !email) {
      setError("Please enter your name and email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          startDate: format(range.from, "yyyy-MM-dd"),
          endDate: format(range.to, "yyyy-MM-dd"),
          guestName: name,
          guestEmail: email,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-surface p-6">
      <div className="text-sm font-semibold tracking-[0.12em] uppercase">{propertyName}</div>
      <p className="mt-2 text-xs text-muted">
        ${nightlyPrice}/night · {minNights}-night minimum
      </p>

      <div className="mt-6">
        {loadingAvailability ? (
          <div className="text-sm text-muted">Loading availability…</div>
        ) : (
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={disabledDays}
            numberOfMonths={1}
          />
        )}
      </div>

      {range?.from && range?.to && nights > 0 && (
        <div className="mt-4 rounded-xl bg-black/5 p-4 text-sm">
          <div>
            {format(range.from, "d MMM yyyy")} → {format(range.to, "d MMM yyyy")}
          </div>
          <div className="mt-1 font-medium text-foreground">
            {nights} night{nights > 1 ? "s" : ""} · ${total} total
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div>
          <label
            htmlFor={`${propertyId}-name`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            Name
          </label>
          <input
            id={`${propertyId}-name`}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor={`${propertyId}-email`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            Email
          </label>
          <input
            id={`${propertyId}-email`}
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Redirecting to payment…" : "Book & pay"}
        </button>
        <p className="text-xs text-muted">
          You&apos;ll be redirected to Stripe to securely complete payment.
        </p>
      </form>
    </div>
  );
}
