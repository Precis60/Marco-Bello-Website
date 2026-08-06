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
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  totalGuests: number | null;
  childrenAges: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
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

const STATUSES = ["pending", "confirmed", "cancelled"];

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
  const [editing, setEditing] = useState<BookingWithPrice | null>(null);
  const [saving, setSaving] = useState(false);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const updateField = <K extends keyof BookingWithPrice>(key: K, value: BookingWithPrice[K]) => {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  };

  const saveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        id: editing.id,
        startDate: editing.startDate,
        endDate: editing.endDate,
        firstName: editing.firstName,
        lastName: editing.lastName,
        email: editing.email,
        phone: editing.phone,
        totalGuests: editing.totalGuests,
        childrenAges: editing.childrenAges,
        checkInTime: editing.checkInTime,
        checkOutTime: editing.checkOutTime,
        specialRequests: editing.specialRequests,
        status: editing.status,
      }),
    });

    if (res.ok) {
      setEditing(null);
      await loadBookings();
    } else {
      const data = await res.json();
      setError(data.error ?? "Couldn’t save booking.");
    }
    setSaving(false);
  };

  const removeBooking = async (id: number) => {
    if (!window.confirm("Delete this booking?")) return;
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    });

    if (res.ok) {
      await loadBookings();
    } else {
      const data = await res.json();
      setError(data.error ?? "Couldn’t delete booking.");
    }
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
      <div className="mx-auto max-w-6xl space-y-6">
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
                        <th className="p-3">Guests</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Status</th>
                        <th className="p-3"></th>
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
                            <div className="font-medium">
                              {b.firstName} {b.lastName}
                            </div>
                            <div className="text-xs text-foreground/70">{b.email}</div>
                            <div className="text-xs text-foreground/70">{b.phone}</div>
                          </td>
                          <td className="p-3">
                            <div>{b.totalGuests ?? 1} guest{(b.totalGuests ?? 1) > 1 ? "s" : ""}</div>
                            {b.childrenAges && (
                              <div className="text-xs text-foreground/70">kids: {b.childrenAges}</div>
                            )}
                          </td>
                          <td className="p-3 font-semibold">${b.total}</td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                b.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : b.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditing(b)}
                                className="text-xs font-semibold text-foreground hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => removeBooking(b.id)}
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {filteredBookings.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold tracking-tight">Special requests</h3>
              {filteredBookings.map((b) => (
                <div
                  key={`requests-${b.id}`}
                  className="rounded-xl border border-black/10 p-4 text-sm"
                >
                  <div className="font-medium">
                    {b.firstName} {b.lastName} · {b.startDate} → {b.endDate}
                  </div>
                  <p className="mt-1 text-foreground">
                    {b.specialRequests?.trim() ? b.specialRequests : "No special requests."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {editing && (
          <div className="rounded-2xl border border-black/10 bg-surface p-6">
            <h2 className="text-xl font-semibold tracking-tight">Edit booking</h2>
            <form onSubmit={saveBooking} className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Property
                </label>
                <input className="input" value={editing.propertyName} disabled />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Status
                </label>
                <select
                  className="input"
                  value={editing.status}
                  onChange={(e) => updateField("status", e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Start date
                </label>
                <input
                  type="date"
                  className="input"
                  value={editing.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  End date
                </label>
                <input
                  type="date"
                  className="input"
                  value={editing.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  First name
                </label>
                <input
                  className="input"
                  value={editing.firstName ?? ""}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Last name
                </label>
                <input
                  className="input"
                  value={editing.lastName ?? ""}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  className="input"
                  value={editing.email ?? ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Phone
                </label>
                <input
                  type="tel"
                  className="input"
                  value={editing.phone ?? ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Total guests
                </label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={editing.totalGuests ?? 1}
                  onChange={(e) => {
                    const n = e.target.value === "" ? null : Number(e.target.value);
                    updateField("totalGuests", n !== null && !Number.isNaN(n) ? n : null);
                  }}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Children&apos;s ages
                </label>
                <input
                  className="input"
                  value={editing.childrenAges ?? ""}
                  onChange={(e) => updateField("childrenAges", e.target.value)}
                  placeholder="e.g. 4, 7"
                />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Check-in time
                </label>
                <input
                  type="time"
                  className="input"
                  value={editing.checkInTime ?? ""}
                  onChange={(e) => updateField("checkInTime", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Check-out time
                </label>
                <input
                  type="time"
                  className="input"
                  value={editing.checkOutTime ?? ""}
                  onChange={(e) => updateField("checkOutTime", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                  Special requests
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={editing.specialRequests ?? ""}
                  onChange={(e) => updateField("specialRequests", e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
