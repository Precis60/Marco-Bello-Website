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
  const [specialRequests, setSpecialRequests] = useState("");
  const [dailyPrices, setDailyPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
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

  useEffect(() => {
    if (!range?.from || !range?.to) return;

    let cancelled = false;
    const start = format(range.from, "yyyy-MM-dd");
    const end = format(range.to, "yyyy-MM-dd");

    fetch(`/api/prices?propertyId=${propertyId}&start=${start}&end=${end}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          const map: Record<string, number> = {};
          for (const item of data.prices ?? []) {
            map[item.date] = item.price;
          }
          setDailyPrices(map);
          setLoadingPrices(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn’t load prices for the selected dates.");
          setLoadingPrices(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId, range]);

  const nights = range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) : 0;
  const priceBreakdown = useMemo(() => {
    if (!range?.from || !range?.to) return [];
    const result: { date: string; price: number }[] = [];
    const cursor = new Date(range.from);
    for (let i = 0; i < nights; i++) {
      const date = format(cursor, "yyyy-MM-dd");
      result.push({ date, price: dailyPrices[date] ?? nightlyPrice });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [range, nightlyPrice, nights, dailyPrices]);
  const total = useMemo(
    () => priceBreakdown.reduce((sum, day) => sum + day.price, 0),
    [priceBreakdown],
  );

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
          specialRequests,
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
            onSelect={(selected) => {
              setRange(selected);
              if (selected?.from && selected?.to) {
                setLoadingPrices(true);
              } else {
                setDailyPrices({});
                setLoadingPrices(false);
              }
            }}
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
          {priceBreakdown.some((day) => day.price !== nightlyPrice) && (
            <p className="mt-1 text-xs text-muted">
              Based on custom nightly rates for these dates.
            </p>
          )}
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
        <div>
          <label
            htmlFor={`${propertyId}-requests`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            Special requests
          </label>
          <textarea
            id={`${propertyId}-requests`}
            className="input"
            rows={3}
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Dietary requirements, accessibility needs, late check-in, etc."
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting || loadingPrices}>
          {submitting ? "Redirecting to payment…" : loadingPrices ? "Loading rates…" : "Book & pay"}
        </button>
        <p className="text-xs text-muted">
          You&apos;ll be redirected to Stripe to securely complete payment.
        </p>
      </form>
    </div>
  );
}
