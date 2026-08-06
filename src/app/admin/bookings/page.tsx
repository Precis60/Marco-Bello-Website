"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker, type Matcher } from "react-day-picker";

import { AdminTabs } from "@/components/AdminTabs";
import { properties } from "@/lib/properties";

interface BookingWithPrice {
  id: number;
  propertyId: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  guestName: string;
  guestEmail: string;
  specialRequests: string | null;
  status: string;
  createdAt: string;
  dailyRate: number;
  total: number;
  breakdown: { date: string; price: number }[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function startOfMonth(date: Date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function overlapsMonth(start: string, end: string, month: Date) {
  const monthStart = startOfMonth(month).getTime();
  const monthEnd = endOfMonth(month).getTime();
  const bookingStart = new Date(start).getTime();
  const bookingEnd = new Date(end).getTime();
  return bookingStart < monthEnd && bookingEnd > monthStart;
}

export default function AdminBookingsPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [bookings, setBookings] = useState<BookingWithPrice[] | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [month, setMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => current - 1 + i);
  }, []);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
  };

  const loadBookings = async () => {
    setLoading(true);
    const res = await fetch("/api/bookings", {
      headers: { "x-admin-token": token },
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to load bookings.");
      setBookings(null);
    } else {
      const data = await res.json();
      setBookings(data.bookings ?? []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authenticated) return;
    loadBookings();
  }, [authenticated]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b) => {
      const matchesProperty = propertyFilter === "all" || b.propertyId === propertyFilter;
      return matchesProperty && overlapsMonth(b.startDate, b.endDate, month);
    });
  }, [bookings, propertyFilter, month]);

  const bookedDays = useMemo<Matcher[]>(() => {
    if (!bookings) return [];
    return bookings
      .filter((b) => propertyFilter === "all" || b.propertyId === propertyFilter)
      .flatMap((b) => {
        const days: Matcher[] = [];
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        const cursor = new Date(start);
        while (cursor < end) {
          days.push(new Date(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }
        return days;
      });
  }, [bookings, propertyFilter]);

  const prevMonth = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    setMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    setMonth(d);
  };

  if (!authenticated) {
    return (
      <div className="py-16 sm:py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-black/10 bg-surface p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Admin login</h1>
          <p className="mt-2 text-sm text-foreground">Enter the admin token to view bookings.</p>
          <form onSubmit={login} className="mt-6 grid gap-4">
            <input
              type="password"
              className="input"
              placeholder="Admin token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl space-y-6">
        <AdminTabs />

        <div className="rounded-2xl border border-black/10 bg-surface p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Booking calendar</h1>
          <p className="mt-2 text-sm text-foreground">
            Use the arrows or month dropdowns to scroll through months. The table shows bookings that
            overlap the selected month.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                Property
              </label>
              <select
                className="input"
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
              >
                <option value="all">All properties</option>
                {Object.values(properties).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="mt-4 flex items-center gap-2">
                <select
                  className="input"
                  value={month.getMonth()}
                  onChange={(e) => {
                    const d = new Date(month);
                    d.setMonth(Number(e.target.value));
                    setMonth(d);
                  }}
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  className="input"
                  value={month.getFullYear()}
                  onChange={(e) => {
                    const d = new Date(month);
                    d.setFullYear(Number(e.target.value));
                    setMonth(d);
                  }}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button onClick={prevMonth} className="btn btn-secondary">
                  ← Previous
                </button>
                <div className="text-sm font-semibold text-foreground">
                  {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
                </div>
                <button onClick={nextMonth} className="btn btn-secondary">
                  Next →
                </button>
              </div>

              <div className="mt-4">
                <DayPicker
                  month={month}
                  onMonthChange={setMonth}
                  modifiers={{ booked: bookedDays }}
                  modifiersClassNames={{ booked: "bg-brand/20 font-semibold" }}
                  numberOfMonths={1}
                  hideNavigation
                />
              </div>
            </div>

            <div className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              {loading ? (
                <p className="text-sm text-foreground">Loading bookings…</p>
              ) : filteredBookings.length === 0 ? (
                <p className="text-sm text-foreground">
                  No bookings for {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}.
                </p>
              ) : (
                <div className="overflow-auto rounded-xl border border-black/10">
                  <table className="w-full text-sm">
                    <thead className="bg-black/5 text-left text-xs uppercase text-foreground">
                      <tr>
                        <th className="p-3">Property</th>
                        <th className="p-3">Dates</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Rate/night</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Requests</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="border-t border-black/10">
                          <td className="p-3">{b.propertyName}</td>
                          <td className="p-3 whitespace-nowrap">
                            {b.startDate} → {b.endDate}
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{b.guestName}</div>
                            <div className="text-xs text-foreground/70">{b.guestEmail}</div>
                          </td>
                          <td className="p-3">${b.dailyRate.toFixed(2)}</td>
                          <td className="p-3 font-semibold">${b.total}</td>
                          <td className="p-3">
                            {b.specialRequests ? (
                              <span
                                className="block max-w-[180px] truncate"
                                title={b.specialRequests}
                              >
                                {b.specialRequests}
                              </span>
                            ) : (
                              <span className="text-foreground/50">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
