"use client";

import { format } from "date-fns";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { type DateRange, type Matcher } from "react-day-picker";

import { Calendar } from "@/components/Calendar";
import { assignLocation } from "@/lib/navigate";
import {
  formatAud,
  LEVY_NOTE,
  normaliseDateKey,
  parseISODate,
  quoteStay,
  STAY_POLICIES,
  type StayQuote,
} from "@/lib/rates";

interface BookedRange {
  start_date: string;
  end_date: string;
}

interface BookingCalendarProps {
  propertyId: string;
  propertyName: string;
}

export function BookingCalendar({ propertyId, propertyName }: BookingCalendarProps) {
  const policy = STAY_POLICIES[propertyId];
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [range, setRange] = useState<DateRange | undefined>();
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [ratesConfirmed, setRatesConfirmed] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [totalGuests, setTotalGuests] = useState<number | "">(2);
  const [childrenAges, setChildrenAges] = useState("");
  const [pets, setPets] = useState(0);
  const [poolTemperature, setPoolTemperature] = useState("");
  const [spaTemperature, setSpaTemperature] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [
      { before: today },
      ...bookedRanges.map((booked) => ({
        from: new Date(booked.start_date),
        to: new Date(new Date(booked.end_date).getTime() - 24 * 60 * 60 * 1000),
      })),
    ];
  }, [bookedRanges]);

  const startDate = range?.from ? format(range.from, "yyyy-MM-dd") : "";
  const endDate = range?.to ? format(range.to, "yyyy-MM-dd") : "";

  useEffect(() => {
    if (!startDate || !endDate || startDate === endDate) return;

    let cancelled = false;
    fetch(`/api/prices?propertyId=${propertyId}&start=${startDate}&end=${endDate}`)
      .then((res) => {
        if (!res.ok) throw new Error("prices");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const map: Record<string, number> = {};
        for (const item of data.prices ?? []) {
          map[normaliseDateKey(item.date)] = item.price;
        }
        setOverrides(map);
        setRatesConfirmed(true);
        setLoadingPrices(false);
      })
      .catch(() => {
        if (!cancelled) {
          setRatesConfirmed(false);
          setError("Couldn't confirm saved rates for these dates. You can still read the published rates below, or enquire.");
          setLoadingPrices(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId, startDate, endDate]);

  const quoteResult = useMemo(() => {
    if (!startDate || !endDate) return null;
    return quoteStay({
      propertyId,
      startDate,
      endDate,
      guests: totalGuests === "" ? 0 : totalGuests,
      pets,
      overrides: ratesConfirmed ? overrides : undefined,
    });
  }, [propertyId, startDate, endDate, totalGuests, pets, overrides, ratesConfirmed]);

  const quote: StayQuote | null = quoteResult?.ok ? quoteResult.quote : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!range?.from || !range?.to) {
      setError("Please select check-in and check-out dates.");
      return;
    }
    if (!quoteResult?.ok) {
      setError(quoteResult?.error ?? "Please check the dates and guest count.");
      return;
    }
    if (!ratesConfirmed) {
      setError("Please wait until the rates for these dates have loaded.");
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
          startDate,
          endDate,
          firstName,
          lastName,
          email,
          phone,
          totalGuests,
          childrenAges,
          pets,
          poolTemperature,
          spaTemperature,
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

      assignLocation(data.url);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div id="availability" className="rounded-2xl border border-black/10 bg-surface p-6">
      <div className="text-sm font-semibold tracking-[0.12em] uppercase">{propertyName}</div>
      <p className="mt-2 text-sm text-muted">
        From {formatAud(policy.fromPrice)} / night
        <span className="mt-1 block text-xs">
          Published seasonal rates. A rate saved for a particular date replaces that night.
        </span>
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
              setRatesConfirmed(false);
              setOverrides({});
              if (selected?.from && selected?.to && format(selected.from, "yyyy-MM-dd") !== format(selected.to, "yyyy-MM-dd")) {
                setLoadingPrices(true);
                setError(null);
              } else {
                setLoadingPrices(false);
              }
            }}
            disabled={disabledDays}
            numberOfMonths={1}
            className="mx-auto"
          />
        )}
      </div>

      {quote && (
        <div className="mt-4 rounded-xl bg-black/5 p-4 text-sm">
          <div>
            {format(parseISODate(startDate), "d MMM yyyy")} → {format(parseISODate(endDate), "d MMM yyyy")}
          </div>
          <dl className="mt-3 grid gap-1">
            <div className="flex justify-between gap-4">
              <dt>
                Accommodation · {quote.nightCount} night{quote.nightCount === 1 ? "" : "s"}
              </dt>
              <dd>{formatAud(quote.accommodation)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Cleaning</dt>
              <dd>{formatAud(quote.cleaning)}</dd>
            </div>
            {quote.extraGuests > 0 && (
              <div className="flex justify-between gap-4">
                <dt>
                  Extra guests · {quote.extraGuestCount} × {formatAud(policy.extraGuestPerNight)} / night
                </dt>
                <dd>{formatAud(quote.extraGuests)}</dd>
              </div>
            )}
            {quote.petFee > 0 && (
              <div className="flex justify-between gap-4">
                <dt>
                  Pets · {quote.petCount}
                </dt>
                <dd>{formatAud(quote.petFee)}</dd>
              </div>
            )}
            <div className="mt-2 flex justify-between gap-4 border-t border-black/10 pt-2 font-medium text-foreground">
              <dt>Total due now</dt>
              <dd>{formatAud(quote.total)}</dd>
            </div>
          </dl>
          {quote.nights.some((night) => night.source === "saved") && (
            <p className="mt-2 text-xs text-muted">Includes a rate saved for one or more of these nights.</p>
          )}
          {quote.nights.length <= 10 && new Set(quote.nights.map((night) => night.price)).size > 1 && (
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {quote.nights.map((night) => (
                <li key={night.date} className="flex justify-between gap-4">
                  <span>{format(parseISODate(night.date), "d MMM")}</span>
                  <span>{formatAud(night.price)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs leading-5 text-muted">
            {quote.levyApplies
              ? LEVY_NOTE
              : "This stay is 28 days or longer, so the Victorian 7.5% short stay levy does not apply."}
          </p>
        </div>
      )}

      {quoteResult && !quoteResult.ok && startDate && endDate && startDate !== endDate && (
        <p className="mt-4 text-sm text-muted">{quoteResult.error}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${propertyId}-firstName`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            First name
          </label>
          <input id={`${propertyId}-firstName`} className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div>
          <label htmlFor={`${propertyId}-lastName`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            Last name
          </label>
          <input id={`${propertyId}-lastName`} className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${propertyId}-email`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            Email address
          </label>
          <input id={`${propertyId}-email`} className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${propertyId}-phone`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            Phone number
          </label>
          <input id={`${propertyId}-phone`} className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div>
          <label htmlFor={`${propertyId}-guests`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            Total guests
          </label>
          <input
            id={`${propertyId}-guests`}
            className="input"
            type="number"
            min={1}
            max={policy.maxGuests}
            value={totalGuests}
            onChange={(e) => setTotalGuests(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
          <p className="mt-1 text-xs text-muted">
            Up to {policy.maxGuests}.
            {policy.extraGuestPerNight > 0
              ? ` Rates include ${policy.includedGuests}. Guests ${policy.includedGuests + 1}–${policy.maxGuests} are ${formatAud(policy.extraGuestPerNight)} per person per night.`
              : ""}
          </p>
        </div>
        <div>
          <label htmlFor={`${propertyId}-children`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
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
        {policy.petsAllowed && (
          <div>
            <label htmlFor={`${propertyId}-pets`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
              Pets
            </label>
            <select
              id={`${propertyId}-pets`}
              className="input"
              value={pets}
              onChange={(e) => setPets(Number(e.target.value))}
            >
              <option value={0}>No pets</option>
              <option value={1}>1 pet · $120 per stay</option>
              <option value={2}>2 pets · $180 per stay</option>
            </select>
            <p className="mt-1 text-xs text-muted">Maximum 2. Please don&apos;t feed the farm animals. Dogs on a lead near livestock.</p>
          </div>
        )}
        {policy.poolIncluded && (
          <>
            <div>
              <label htmlFor={`${propertyId}-pool`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                Pool temperature
              </label>
              <input
                id={`${propertyId}-pool`}
                className="input"
                value={poolTemperature}
                onChange={(e) => setPoolTemperature(e.target.value)}
                placeholder="Your preferred temperature"
                maxLength={40}
              />
            </div>
            <div>
              <label htmlFor={`${propertyId}-spa`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
                Spa temperature
              </label>
              <input
                id={`${propertyId}-spa`}
                className="input"
                value={spaTemperature}
                onChange={(e) => setSpaTemperature(e.target.value)}
                placeholder="Your preferred temperature"
                maxLength={40}
              />
            </div>
            <p className="text-xs leading-5 text-muted sm:col-span-2">
              Your pool, your temperature. Solar-powered heating is set for the whole stay and included. We confirm the setting before you arrive.
            </p>
          </>
        )}
        <div>
          <label htmlFor={`${propertyId}-checkin`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            Requested check-in time
          </label>
          <input id={`${propertyId}-checkin`} className="input" type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${propertyId}-checkout`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            Requested check-out time
          </label>
          <input id={`${propertyId}-checkout`} className="input" type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
        </div>
        <p className="text-xs leading-5 text-muted sm:col-span-2">
          Standard times are 2:00pm check-in and 10:00am check-out. Early check-in or late check-out is $150 each, only when there is no same-day turnover, and is confirmed separately.
        </p>
        <div className="sm:col-span-2">
          <label htmlFor={`${propertyId}-requests`} className="text-xs font-semibold tracking-[0.18em] uppercase text-muted">
            Special requests
          </label>
          <textarea
            id={`${propertyId}-requests`}
            className="input"
            rows={3}
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Access needs, or anything else we should know"
          />
        </div>
        <div className="sm:col-span-2">
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || loadingPrices || !quote || !ratesConfirmed}
          >
            {submitting ? "Redirecting to payment…" : loadingPrices ? "Loading rates…" : "Book & pay"}
          </button>
          <p className="mt-2 text-xs leading-5 text-muted">
            You&apos;ll be redirected to Stripe to pay the total above. Experiences, the in-house host and pantry orders are requested separately and are not part of this payment.
          </p>
        </div>
      </form>
    </div>
  );
}
