"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLogin, REJECTED_TOKEN } from "@/components/AdminLogin";
import { Calendar } from "@/components/Calendar";
import { DateField } from "@/components/DateField";
import { formatDate, isoDate } from "@/lib/format";
import { properties } from "@/lib/properties";
import { formatMinutes, statusLabel } from "@/lib/work";

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

interface Task {
  id: number;
  property_id: string | null;
  title: string;
  details: string | null;
  assignee: string | null;
  due_date: string | null;
  status: string;
  area: string | null;
  work_type: string | null;
  minutes: number | null;
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
  {
    value: "event",
    label: "Event",
    className: "day-event",
    swatch: "bg-brand/25",
  },
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
  for (
    let day = localDate(startIso);
    day <= end;
    day.setDate(day.getDate() + 1)
  ) {
    days.push(new Date(day));
  }
  return days;
}

function kindLabel(kind: string) {
  return KINDS.find((k) => k.value === kind)?.label ?? kind;
}

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday of the week containing `date`, matching the calendar's week start. */
function startOfWeek(date: Date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function AdminCalendarPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));
  const [view, setView] = useState("month");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
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
  const [editingId, setEditingId] = useState<number | null>(null);

  const login = () => {
    setAuthenticated(true);
  };

  const loadEvents = async () => {
    const res = await fetch("/api/events", {
      headers: { "x-admin-token": token },
    });
    if (!res.ok) {
      const data = await res.json();
      if (res.status === 401) {
        setAuthenticated(false);
        setError(REJECTED_TOKEN);
      } else {
        setError(data.error ?? "Couldn’t load the calendar.");
      }
      setEvents(null);
      return;
    }
    const data = await res.json();
    setEvents(data.events ?? []);
    setError(null);
  };

  const loadTasks = async () => {
    const res = await fetch("/api/tasks", {
      headers: { "x-admin-token": token },
    });
    if (!res.ok) return;
    const data = await res.json();
    setTasks((data.tasks ?? []).filter((task: Task) => task.due_date));
  };

  const loadStays = async () => {
    const res = await fetch("/api/bookings", {
      headers: { "x-admin-token": token },
    });
    if (!res.ok) return;
    const data = await res.json();
    setStays(
      (data.bookings ?? []).filter((b: Stay) => b.status !== "cancelled"),
    );
  };

  useEffect(() => {
    if (!authenticated) return;
    loadEvents();
    loadTasks();
    loadStays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const visible = useMemo(() => {
    if (!events) return [];
    return events.filter(
      (e) =>
        (kindFilter === "all" || e.kind === kindFilter) &&
        (propertyFilter === "all" ||
          (propertyFilter === "farm"
            ? e.property_id === null
            : e.property_id === propertyFilter)),
    );
  }, [events, kindFilter, propertyFilter]);

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          propertyFilter === "all" ||
          (propertyFilter === "farm"
            ? task.property_id === null
            : task.property_id === propertyFilter),
      ),
    [tasks, propertyFilter],
  );

  /** First and last day covered by the Day, Week or Month view. */
  const range = useMemo(() => {
    if (view === "day") return { start: selectedDay, end: selectedDay };
    if (view === "week") {
      const start = startOfWeek(selectedDay);
      return { start, end: addDays(start, 6) };
    }
    return {
      start: startOfMonth(month),
      end: new Date(month.getFullYear(), month.getMonth() + 1, 0),
    };
  }, [view, selectedDay, month]);

  const rangeDays = useMemo(() => {
    const days: Date[] = [];
    for (let day = range.start; day <= range.end; day = addDays(day, 1))
      days.push(day);
    return days;
  }, [range]);

  const rangeTasks = useMemo(() => {
    const start = toIso(range.start);
    const end = toIso(range.end);
    return visibleTasks
      .filter((task) => {
        const due = isoDate(task.due_date ?? "");
        return due >= start && due <= end;
      })
      .sort((a, b) =>
        isoDate(a.due_date ?? "").localeCompare(isoDate(b.due_date ?? "")),
      );
  }, [visibleTasks, range]);

  const rangeEntries = useMemo(() => {
    const start = toIso(range.start);
    const end = toIso(range.end);
    return visible
      .filter(
        (e) => isoDate(e.start_date) <= end && isoDate(e.end_date) >= start,
      )
      .sort((a, b) =>
        isoDate(a.start_date).localeCompare(isoDate(b.start_date)),
      );
  }, [visible, range]);

  /** Everything landing on a single day, for the Day and Week views. */
  const itemsOn = (date: Date) => {
    const iso = toIso(date);
    return {
      events: visible.filter(
        (e) =>
          isoDate(e.start_date) <= iso &&
          isoDate(e.end_date) >= iso &&
          e.status !== "cancelled",
      ),
      tasks: visibleTasks.filter(
        (task) => isoDate(task.due_date ?? "") === iso,
      ),
      stays: stays.filter(
        (stay) =>
          isoDate(stay.startDate) <= iso &&
          toIso(addDays(localDate(stay.endDate), -1)) >= iso,
      ),
    };
  };

  const shift = (direction: number) => {
    if (view === "month") {
      const next = new Date(
        month.getFullYear(),
        month.getMonth() + direction,
        1,
      );
      setMonth(next);
      setSelectedDay(next);
      return;
    }
    const next = addDays(selectedDay, direction * (view === "week" ? 7 : 1));
    setSelectedDay(next);
    setMonth(startOfMonth(next));
  };

  const goToday = () => {
    const today = new Date();
    setSelectedDay(today);
    setMonth(startOfMonth(today));
  };

  const dayStays = useMemo(() => {
    const iso = toIso(selectedDay);
    return stays.filter(
      (stay) =>
        isoDate(stay.startDate) <= iso &&
        toIso(addDays(localDate(stay.endDate), -1)) >= iso,
    );
  }, [stays, selectedDay]);

  const rangeTitle =
    view === "day"
      ? selectedDay.toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : view === "week"
        ? `${range.start.toLocaleDateString("en-AU", { day: "numeric", month: "short" })} – ${range.end.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`
        : month.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  const modifiers = useMemo(() => {
    const byKind: Record<string, Date[]> = {
      "day-event": [],
      "day-scheduled": [],
      "day-confirmed": [],
      "day-contractor": [],
      "day-task": [],
      "day-stay": [],
    };

    for (const task of tasks) {
      if (task.status === "done" || !task.due_date) continue;
      byKind["day-task"].push(localDate(task.due_date));
    }

    for (const e of visible) {
      if (e.status === "cancelled") continue;
      const className =
        KINDS.find((k) => k.value === e.kind)?.className ?? "day-event";
      byKind[className].push(...daysInRange(e.start_date, e.end_date));
    }

    for (const stay of stays) {
      // Checkout day isn't an occupied night.
      const end = localDate(stay.endDate);
      end.setDate(end.getDate() - 1);
      byKind["day-stay"].push(...daysInRange(stay.startDate, toIso(end)));
    }

    return byKind;
  }, [visible, tasks, stays]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setKind(KINDS[0].value);
    setStatus("scheduled");
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setContractor("");
    setContact("");
    setNotes("");
    setPropertyId("");
  };

  /** Copies an entry into the form below and scrolls to it. */
  const fillForm = (event: CalendarEvent) => {
    setTitle(event.title);
    setKind(event.kind);
    setStatus(event.status);
    setStartDate(isoDate(event.start_date));
    setEndDate(isoDate(event.end_date));
    setStartTime(event.start_time ?? "");
    setEndTime(event.end_time ?? "");
    setContractor(event.contractor ?? "");
    setContact(event.contact ?? "");
    setNotes(event.notes ?? "");
    setPropertyId(event.property_id ?? "");
    setError(null);
    document
      .getElementById("event-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Loads an existing entry into the form below so it can be changed. */
  const startEditing = (event: CalendarEvent) => {
    setEditingId(event.id);
    fillForm(event);
  };

  /** Prefills the form from an entry as a new, unsaved copy. */
  const duplicateEvent = (event: CalendarEvent) => {
    setEditingId(null);
    fillForm(event);
    setTitle(`${event.title} (copy)`);
  };

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/events", {
      method: editingId === null ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        ...(editingId === null ? {} : { id: editingId }),
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
      if (editingId === null) {
        setTitle("");
        setStartTime("");
        setEndTime("");
        setContractor("");
        setContact("");
        setNotes("");
      } else {
        resetForm();
      }
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
    if (res.ok) {
      if (editingId === id) resetForm();
      await loadEvents();
    } else setError("Couldn’t delete that entry.");
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
              Events, scheduled and confirmed works, and contractor bookings,
              alongside guest stays.
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
              mode="single"
              selected={selectedDay}
              onSelect={(day) => {
                if (!day) return;
                setSelectedDay(day);
                setMonth(startOfMonth(day));
              }}
              month={month}
              onMonthChange={setMonth}
              modifiers={modifiers}
              modifiersClassNames={{
                "day-event": "day-event",
                "day-scheduled": "day-scheduled",
                "day-confirmed": "day-confirmed",
                "day-contractor": "day-contractor",
                "day-task": "day-task",
                "day-stay": "day-stay",
              }}
              className="mx-auto"
            />
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-black/10 pt-4 text-xs text-muted">
              {KINDS.map((k) => (
                <span key={k.value} className="flex items-center gap-2">
                  <span
                    className={`size-3 rounded-full ${k.swatch}`}
                    aria-hidden="true"
                  />
                  {k.label}
                </span>
              ))}
              <span className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full bg-violet-200"
                  aria-hidden="true"
                />
                Task
              </span>
              <span className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full bg-black/15"
                  aria-hidden="true"
                />
                Guest stay
              </span>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="inline-flex rounded-xl border border-black/10 bg-black/[0.03] p-1"
                role="tablist"
                aria-label="Calendar view"
              >
                {VIEWS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    role="tab"
                    aria-selected={view === v.value}
                    onClick={() => setView(v.value)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                      view === v.value
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => shift(-1)}
                  className="rounded-lg border border-black/10 px-2.5 py-1.5"
                  aria-label={`Previous ${view}`}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  className="rounded-lg border border-black/10 px-3 py-1.5"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => shift(1)}
                  className="rounded-lg border border-black/10 px-2.5 py-1.5"
                  aria-label={`Next ${view}`}
                >
                  ›
                </button>
              </div>
            </div>

            <h3 className="mt-5 text-sm font-semibold">{rangeTitle}</h3>

            {events === null ? (
              <p className="mt-4 text-sm text-muted">Loading…</p>
            ) : view === "week" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {rangeDays.map((day) => {
                  const items = itemsOn(day);
                  const empty =
                    items.events.length === 0 &&
                    items.tasks.length === 0 &&
                    items.stays.length === 0;
                  return (
                    <div
                      key={toIso(day)}
                      className={`rounded-xl border p-4 ${
                        toIso(day) === toIso(new Date())
                          ? "border-brand/40 bg-brand/[0.04]"
                          : "border-black/10"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDay(day);
                          setView("day");
                        }}
                        className="text-sm font-semibold hover:underline"
                      >
                        {day.toLocaleDateString("en-AU", {
                          weekday: "short",
                          day: "numeric",
                        })}
                      </button>
                      {empty ? (
                        <p className="mt-2 text-xs text-muted">
                          Nothing scheduled.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1.5 text-xs">
                          {items.events.map((e) => (
                            <li
                              key={`e${e.id}`}
                              className="flex items-start gap-2"
                            >
                              <span
                                className={`mt-1 size-2 shrink-0 rounded-full ${
                                  KINDS.find((k) => k.value === e.kind)
                                    ?.swatch ?? "bg-brand/25"
                                }`}
                                aria-hidden="true"
                              />
                              <span>
                                {e.start_time && `${e.start_time} `}
                                {e.title}
                              </span>
                            </li>
                          ))}
                          {items.tasks.map((task) => (
                            <li
                              key={`t${task.id}`}
                              className="flex items-start gap-2"
                            >
                              <span
                                className="mt-1 size-2 shrink-0 rounded-full bg-violet-200"
                                aria-hidden="true"
                              />
                              <span>{task.title}</span>
                            </li>
                          ))}
                          {items.stays.map((stay) => (
                            <li
                              key={`s${stay.id}`}
                              className="flex items-start gap-2"
                            >
                              <span
                                className="mt-1 size-2 shrink-0 rounded-full bg-black/15"
                                aria-hidden="true"
                              />
                              <span>
                                {stay.firstName} {stay.lastName} ·{" "}
                                {stay.propertyName}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : rangeEntries.length === 0 && rangeTasks.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Nothing scheduled{" "}
                {view === "day" ? "on this day" : "this month"}.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {rangeEntries.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-lg border border-black/10 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{e.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          {kindLabel(e.kind)} ·{" "}
                          {e.property_id
                            ? properties[e.property_id]?.name
                            : "Whole farm"}
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

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
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

                    {e.notes && (
                      <p className="mt-2 text-xs text-muted">{e.notes}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-2 text-xs">
                      <select
                        className="rounded border border-black/10 px-2 py-1 text-xs font-semibold"
                        value={e.status}
                        onChange={(event) => changeStatus(e, event.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-3 font-semibold">
                        <button
                          onClick={() => startEditing(e)}
                          className="text-brand hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => duplicateEvent(e)}
                          className="text-brand hover:underline"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => removeEvent(e.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {view !== "week" && rangeTasks.length > 0 && (
              <div className="mt-8 border-t border-black/10 pt-6">
                <h4 className="text-sm font-semibold">Tasks assigned</h4>
                <ul className="mt-4 space-y-2">
                  {rangeTasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-lg border border-black/10 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{task.title}</p>
                          <p className="mt-1 text-xs text-muted">
                            {[
                              task.area,
                              task.work_type,
                              task.property_id
                                ? properties[task.property_id]?.name
                                : "Whole farm",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-violet-800 uppercase">
                          {statusLabel(task.status)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                        <span>{formatDate(task.due_date ?? "")}</span>
                        {task.assignee && <span>{task.assignee}</span>}
                        {task.minutes != null && (
                          <span>{formatMinutes(task.minutes)}</span>
                        )}
                      </div>
                      {task.details && (
                        <p className="mt-3 text-sm text-muted">
                          {task.details}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted">
                  Tasks are added and updated on the Tasks page.
                </p>
              </div>
            )}

            {view === "day" && dayStays.length > 0 && (
              <div className="mt-8 border-t border-black/10 pt-6">
                <h4 className="text-sm font-semibold">Guest stays</h4>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  {dayStays.map((stay) => (
                    <li key={stay.id}>
                      {stay.firstName} {stay.lastName} · {stay.propertyName} ·{" "}
                      {formatDate(stay.startDate)} – {formatDate(stay.endDate)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card" id="event-form">
        <h2 className="card-title">
          {editingId === null ? "Schedule something" : "Edit entry"}
        </h2>
        <p className="card-subtitle">
          {editingId === null
            ? "Add an event, a work order or a contractor visit. Single-day entries only need a first day."
            : "Change any detail of this entry, then save it."}
        </p>

        <form onSubmit={saveEvent} className="mt-8 grid gap-5 sm:grid-cols-2">
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

          <div className="mt-2 flex justify-end gap-3 border-t border-black/10 pt-5 sm:col-span-2">
            {editingId !== null && (
              <button
                type="button"
                className="btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !title.trim() || !startDate}
            >
              {saving
                ? "Saving…"
                : editingId === null
                  ? "Add to calendar"
                  : "Save changes"}
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
