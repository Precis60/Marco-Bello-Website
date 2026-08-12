"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker, type Matcher } from "react-day-picker";

import { AdminLogin } from "@/components/AdminLogin";
import { formatCurrency, formatDate } from "@/lib/format";
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
      <AdminLogin
        token={token}
        onTokenChange={setToken}
        onSubmit={login}
        description="Enter the admin token to view and edit bookings."
        error={error}
      />
    );
  }

  return (
    <>
      <section className="card">
        <h2 className="card-title">Booking calendar</h2>
        <p className="card-subtitle">
          Use the arrows or month dropdowns to move between months. The table lists bookings that
          overlap the selected month.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="booking-property">
              Property
            </label>
            <select
              id="booking-property"
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

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="booking-month">
                  Month
                </label>
                <select
                  id="booking-month"
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
              </div>
              <div>
                <label className="field-label" htmlFor="booking-year">
                  Year
                </label>
                <select
                  id="booking-year"
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
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <button onClick={prevMonth} className="btn btn-secondary" aria-label="Previous month">
                ← Previous
              </button>
              <div className="text-sm font-semibold">
                {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
              </div>
              <button onClick={nextMonth} className="btn btn-secondary" aria-label="Next month">
                Next →
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-black/10 p-4">
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
            {error && (
              <p className="rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {loading ? (
              <p className="text-sm text-muted">Loading bookings…</p>
            ) : filteredBookings.length === 0 ? (
              <p className="text-sm text-muted">
                No bookings for {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}.
              </p>
            ) : (
              <div className="overflow-auto rounded-xl border border-black/10">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Dates</th>
                      <th>Client</th>
                      <th>Guests</th>
                      <th className="text-right">Total</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.propertyName}</td>
                        <td className="whitespace-nowrap">
                          {formatDate(b.startDate)}
                          <div className="text-xs text-muted">to {formatDate(b.endDate)}</div>
                        </td>
                        <td>
                          <div className="font-medium">
                            {b.firstName} {b.lastName}
                          </div>
                          <div className="text-xs text-muted">{b.email}</div>
                          <div className="text-xs text-muted">{b.phone}</div>
                        </td>
                        <td>
                          <div>
                            {b.totalGuests ?? 1} guest
                            {(b.totalGuests ?? 1) > 1 ? "s" : ""}
                          </div>
                          {b.childrenAges && (
                            <div className="text-xs text-muted">kids: {b.childrenAges}</div>
                          )}
                        </td>
                        <td className="text-right font-semibold tabular-nums">
                          {formatCurrency(b.total)}
                        </td>
                        <td>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${
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
                        <td>
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setEditing(b)}
                              className="text-xs font-semibold hover:underline"
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
          <div className="mt-8 border-t border-black/10 pt-8">
            <h3 className="text-base font-semibold tracking-tight">Special requests</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {filteredBookings.map((b) => (
                <div
                  key={`requests-${b.id}`}
                  className="rounded-xl border border-black/10 p-4 text-sm"
                >
                  <div className="font-medium">
                    {b.firstName} {b.lastName}
                  </div>
                  <div className="text-xs text-muted">
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </div>
                  <p className="mt-2 text-muted">
                    {b.specialRequests?.trim() ? b.specialRequests : "No special requests."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {editing && (
        <section className="card">
          <h2 className="card-title">Edit booking</h2>
          <p className="card-subtitle">
            {editing.propertyName} · {formatDate(editing.startDate)} → {formatDate(editing.endDate)}
          </p>
          <form onSubmit={saveBooking} className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label">Property</label>
              <input className="input" value={editing.propertyName} disabled />
            </div>
            <div>
              <label className="field-label">Status</label>
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
              <label className="field-label">Start date</label>
              <input
                type="date"
                className="input"
                value={editing.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">End date</label>
              <input
                type="date"
                className="input"
                value={editing.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">First name</label>
              <input
                className="input"
                value={editing.firstName ?? ""}
                onChange={(e) => updateField("firstName", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">Last name</label>
              <input
                className="input"
                value={editing.lastName ?? ""}
                onChange={(e) => updateField("lastName", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Email</label>
              <input
                type="email"
                className="input"
                value={editing.email ?? ""}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Phone</label>
              <input
                type="tel"
                className="input"
                value={editing.phone ?? ""}
                onChange={(e) => updateField("phone", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">Total guests</label>
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
              <label className="field-label">Children&apos;s ages</label>
              <input
                className="input"
                value={editing.childrenAges ?? ""}
                onChange={(e) => updateField("childrenAges", e.target.value)}
                placeholder="e.g. 4, 7"
              />
            </div>
            <div>
              <label className="field-label">Check-in time</label>
              <input
                type="time"
                className="input"
                value={editing.checkInTime ?? ""}
                onChange={(e) => updateField("checkInTime", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Check-out time</label>
              <input
                type="time"
                className="input"
                value={editing.checkOutTime ?? ""}
                onChange={(e) => updateField("checkOutTime", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Special requests</label>
              <textarea
                className="input"
                rows={3}
                value={editing.specialRequests ?? ""}
                onChange={(e) => updateField("specialRequests", e.target.value)}
              />
            </div>

            <div className="mt-2 flex justify-end gap-3 border-t border-black/10 pt-5 sm:col-span-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
