"use client";

import { differenceInCalendarDays, format, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { type DateRange, type Matcher } from "react-day-picker";

import { Calendar } from "@/components/Calendar";

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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [totalGuests, setTotalGuests] = useState<number | "">(1);
  const [childrenAges, setChildrenAges] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
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
    if (!firstName || !lastName || !email || !phone || totalGuests === "" || totalGuests < 1) {
      setError("Please fill in your name, email, phone, and number of guests.");
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
          firstName,
          lastName,
          email,
          phone,
          totalGuests,
          childrenAges,
          checkInTime,
          checkOutTime,
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
          <Calendar
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
            className="mx-auto"
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

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${propertyId}-firstName`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            First name
          </label>
          <input
            id={`${propertyId}-firstName`}
            className="input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor={`${propertyId}-lastName`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            Last name
          </label>
          <input
            id={`${propertyId}-lastName`}
            className="input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor={`${propertyId}-email`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            Email address
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
        <div className="sm:col-span-2">
          <label
            htmlFor={`${propertyId}-phone`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            Phone number
          </label>
          <input
            id={`${propertyId}-phone`}
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor={`${propertyId}-guests`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            Total guests
          </label>
          <input
            id={`${propertyId}-guests`}
            className="input"
            type="number"
            min={1}
            value={totalGuests}
            onChange={(e) => setTotalGuests(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label
            htmlFor={`${propertyId}-children`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            Children&apos;s ages
          </label>
          <input
            id={`${propertyId}-children`}
            className="input"
            value={childrenAges}
            onChange={(e) => setChildrenAges(e.target.value)}
            placeholder="e.g. 4, 7"
          />
        </div>
        <div>
          <label
            htmlFor={`${propertyId}-checkin`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            Requested check-in time
          </label>
          <input
            id={`${propertyId}-checkin`}
            className="input"
            type="time"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor={`${propertyId}-checkout`}
            className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
          >
            Requested check-out time
          </label>
          <input
            id={`${propertyId}-checkout`}
            className="input"
            type="time"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
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
            placeholder="Dietary requirements, accessibility needs, anything else we should know..."
          />
        </div>

        <div className="sm:col-span-2">
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="sm:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={submitting || loadingPrices}>
            {submitting
              ? "Redirecting to payment…"
              : loadingPrices
                ? "Loading rates…"
                : "Book & pay"}
          </button>
          <p className="mt-2 text-xs text-muted">
            You&apos;ll be redirected to Stripe to securely complete payment.
          </p>
        </div>
      </form>
    </div>
  );
}
