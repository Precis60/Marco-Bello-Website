"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLogin } from "@/components/AdminLogin";
import { Calendar } from "@/components/Calendar";
import { DateField } from "@/components/DateField";
import { formatDate, isoDate } from "@/lib/format";
import { properties } from "@/lib/properties";

interface CalendarEvent {
  id: number;
  property_id: string | null;
  title: string;
  kind: string;
  status: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  contractor: string | null;
  contact: string | null;
  notes: string | null;
}

interface Stay {
  id: number;
  propertyName: string;
  startDate: string;
  endDate: string;
  firstName: string;
  lastName: string;
  status: string;
}

const KINDS = [
  { value: "event", label: "Event", className: "day-event", swatch: "bg-brand/25" },
  {
    value: "scheduled-work",
    label: "Scheduled work",
    className: "day-scheduled",
    swatch: "bg-amber-200",
  },
  {
    value: "confirmed-work",
    label: "Confirmed work",
    className: "day-confirmed",
    swatch: "bg-green-200",
  },
  {
    value: "contractor",
    label: "Contractor booking",
    className: "day-contractor",
    swatch: "bg-sky-200",
  },
];

const STATUSES = ["scheduled", "confirmed", "completed", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-black/[0.06] text-muted",
  cancelled: "bg-red-100 text-red-800",
};

function localDate(value: string) {
  const [year, month, day] = isoDate(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIso(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Every day covered by an inclusive date range. */
function daysInRange(startIso: string, endIso: string) {
  const days: Date[] = [];
  const end = localDate(endIso);
  for (let day = localDate(startIso); day <= end; day.setDate(day.getDate() + 1)) {
    days.push(new Date(day));
  }
  return days;
}

function kindLabel(kind: string) {
  return KINDS.find((k) => k.value === kind)?.label ?? kind;
}

export default function AdminCalendarPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [stays, setStays] = useState<Stay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(new Date());
  const [kindFilter, setKindFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState(KINDS[0].value);
  const [status, setStatus] = useState("scheduled");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [contractor, setContractor] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [saving, setSaving] = useState(false);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
  };

  const loadEvents = async () => {
    const res = await fetch("/api/events", { headers: { "x-admin-token": token } });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Couldn’t load the calendar.");
      setEvents(null);
      return;
    }
    const data = await res.json();
    setEvents(data.events ?? []);
    setError(null);
  };

  const loadStays = async () => {
    const res = await fetch("/api/bookings", { headers: { "x-admin-token": token } });
    if (!res.ok) return;
    const data = await res.json();
    setStays((data.bookings ?? []).filter((b: Stay) => b.status !== "cancelled"));
  };

  useEffect(() => {
    if (!authenticated) return;
    loadEvents();
    loadStays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const visible = useMemo(() => {
    if (!events) return [];
    return events.filter(
      (e) =>
        (kindFilter === "all" || e.kind === kindFilter) &&
        (propertyFilter === "all" ||
          (propertyFilter === "farm" ? e.property_id === null : e.property_id === propertyFilter)),
    );
  }, [events, kindFilter, propertyFilter]);

  const monthEntries = useMemo(() => {
    const prefix = `${month.getFullYear()}-${`${month.getMonth() + 1}`.padStart(2, "0")}`;
    return visible
      .filter(
        (e) => isoDate(e.start_date) <= `${prefix}-31` && isoDate(e.end_date) >= `${prefix}-01`,
      )
      .sort((a, b) => isoDate(a.start_date).localeCompare(isoDate(b.start_date)));
  }, [visible, month]);

  const modifiers = useMemo(() => {
    const byKind: Record<string, Date[]> = {
      "day-event": [],
      "day-scheduled": [],
      "day-confirmed": [],
      "day-contractor": [],
      "day-stay": [],
    };

    for (const e of visible) {
      if (e.status === "cancelled") continue;
      const className = KINDS.find((k) => k.value === e.kind)?.className ?? "day-event";
      byKind[className].push(...daysInRange(e.start_date, e.end_date));
    }

    for (const stay of stays) {
      // Checkout day isn't an occupied night.
      const end = localDate(stay.endDate);
      end.setDate(end.getDate() - 1);
      byKind["day-stay"].push(...daysInRange(stay.startDate, toIso(end)));
    }

    return byKind;
  }, [visible, stays]);

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId: propertyId || null,
        title,
        kind,
        status,
        startDate,
        endDate: endDate || startDate,
        startTime,
        endTime,
        contractor,
        contact,
        notes,
      }),
    });

    if (res.ok) {
      setTitle("");
      setStartTime("");
      setEndTime("");
      setContractor("");
      setContact("");
      setNotes("");
      await loadEvents();
    } else {
      const data = await res.json();
      setError(data.error ?? "Couldn’t save that entry.");
    }
    setSaving(false);
  };

  const changeStatus = async (event: CalendarEvent, next: string) => {
    setError(null);
    const res = await fetch("/api/events", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id: event.id, status: next }),
    });
    if (res.ok) await loadEvents();
    else setError("Couldn’t update that entry.");
  };

  const removeEvent = async (id: number) => {
    setError(null);
    const res = await fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    });
    if (res.ok) await loadEvents();
    else setError("Couldn’t delete that entry.");
  };

  if (!authenticated) {
    return (
      <AdminLogin
        token={token}
        onTokenChange={setToken}
        onSubmit={login}
        description="Enter the admin token to see the operations calendar."
        error={error}
      />
    );
  }

  return (
    <>
      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="card-title">Operations calendar</h2>
            <p className="card-subtitle">
              Events, scheduled and confirmed works, and contractor bookings, alongside guest stays.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="field-label" htmlFor="calendar-kind-filter">
                Type
              </label>
              <select
                id="calendar-kind-filter"
                className="input"
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
              >
                <option value="all">All types</option>
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="calendar-property-filter">
                Property
              </label>
              <select
                id="calendar-property-filter"
                className="input"
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="farm">Whole farm</option>
                {Object.values(properties).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr]">
          <div className="rounded-2xl border border-black/10 p-4">
            <Calendar
              month={month}
              onMonthChange={setMonth}
              modifiers={modifiers}
              modifiersClassNames={{
                "day-event": "day-event",
                "day-scheduled": "day-scheduled",
                "day-confirmed": "day-confirmed",
                "day-contractor": "day-contractor",
                "day-stay": "day-stay",
              }}
              className="mx-auto"
            />
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-black/10 pt-4 text-xs text-muted">
              {KINDS.map((k) => (
                <span key={k.value} className="flex items-center gap-2">
                  <span className={`size-3 rounded-full ${k.swatch}`} aria-hidden="true" />
                  {k.label}
                </span>
              ))}
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-black/15" aria-hidden="true" />
                Guest stay
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              {month.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
            </h3>
            {events === null ? (
              <p className="mt-4 text-sm text-muted">Loading…</p>
            ) : monthEntries.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nothing scheduled this month.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {monthEntries.map((e) => (
                  <li key={e.id} className="rounded-xl border border-black/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{e.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          {kindLabel(e.kind)} ·{" "}
                          {e.property_id ? properties[e.property_id]?.name : "Whole farm"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${
                          STATUS_STYLES[e.status] ?? STATUS_STYLES.scheduled
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span>
                        {formatDate(e.start_date)}
                        {isoDate(e.end_date) !== isoDate(e.start_date) &&
                          ` – ${formatDate(e.end_date)}`}
                      </span>
                      {e.start_time && (
                        <span>
                          {e.start_time}
                          {e.end_time && `–${e.end_time}`}
                        </span>
                      )}
                      {e.contractor && <span>{e.contractor}</span>}
                      {e.contact && <span>{e.contact}</span>}
                    </div>

                    {e.notes && <p className="mt-3 text-sm text-muted">{e.notes}</p>}

                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-black/10 pt-3 text-xs font-semibold">
                      <label className="flex items-center gap-2 font-normal text-muted">
                        Status
                        <select
                          className="rounded-lg border border-black/10 px-2 py-1 text-xs font-semibold"
                          value={e.status}
                          onChange={(event) => changeStatus(e, event.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        onClick={() => removeEvent(e.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Schedule something</h2>
        <p className="card-subtitle">
          Add an event, a work order or a contractor visit. Single-day entries only need a first
          day.
        </p>

        <form onSubmit={addEvent} className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="event-title">
              Title
            </label>
            <input
              id="event-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Replace vineyard irrigation line"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="event-kind">
              Type
            </label>
            <select
              id="event-kind"
              className="input"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="event-status">
              Status
            </label>
            <select
              id="event-status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <DateField
            id="event-start"
            label="First day"
            value={startDate}
            onChange={(value) => {
              setStartDate(value);
              if (endDate && value && endDate < value) setEndDate("");
            }}
          />
          <DateField
            id="event-end"
            label="Last day (optional)"
            value={endDate}
            min={startDate || undefined}
            onChange={setEndDate}
            placeholder="Same day"
          />
          <div>
            <label className="field-label" htmlFor="event-start-time">
              Start time (optional)
            </label>
            <input
              id="event-start-time"
              className="input"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="event-end-time">
              End time (optional)
            </label>
            <input
              id="event-end-time"
              className="input"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="event-contractor">
              Contractor (optional)
            </label>
            <input
              id="event-contractor"
              className="input"
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              placeholder="e.g. Hunter Electrical"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="event-contact">
              Contact (optional)
            </label>
            <input
              id="event-contact"
              className="input"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone or email"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="event-property">
              Applies to
            </label>
            <select
              id="event-property"
              className="input"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            >
              <option value="">Whole farm</option>
              {Object.values(properties).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="event-notes">
              Notes (optional)
            </label>
            <textarea
              id="event-notes"
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mt-2 flex justify-end border-t border-black/10 pt-5 sm:col-span-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !title.trim() || !startDate}
            >
              {saving ? "Saving…" : "Add to calendar"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-6 rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>
    </>
  );
}
