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

export default function AdminBookingsPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [bookings, setBookings] = useState<BookingWithPrice[] | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [month, setMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!selectedDate) return matchesProperty;
      const selected = new Date(selectedDate);
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      // selected is within the booking range (inclusive of start, exclusive of checkout)
      const matchDate = selected >= start && selected < end;
      return matchesProperty && matchDate;
    });
  }, [bookings, propertyFilter, selectedDate]);

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
            Select a day to filter bookings by that date. Use the property dropdown to narrow results.
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

              <div className="mt-4">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  onMonthChange={setMonth}
                  month={month}
                  modifiers={{ booked: bookedDays }}
                  modifiersClassNames={{ booked: "bg-brand/20 font-semibold" }}
                  numberOfMonths={1}
                />
              </div>

              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(undefined)}
                  className="mt-2 text-xs text-foreground underline"
                >
                  Clear date filter
                </button>
              )}
            </div>

            <div className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              {loading ? (
                <p className="text-sm text-foreground">Loading bookings…</p>
              ) : filteredBookings.length === 0 ? (
                <p className="text-sm text-foreground">No bookings match the selected filters.</p>
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
