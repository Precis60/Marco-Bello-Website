"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLogin, REJECTED_TOKEN } from "@/components/AdminLogin";
import { DateField } from "@/components/DateField";
import { formatDate, isoDate } from "@/lib/format";
import { properties } from "@/lib/properties";
import { staff, staffInitials } from "@/lib/staff";
import {
  AREAS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  WORK_TYPES,
  formatMinutes,
  statusLabel,
} from "@/lib/work";

interface Task {
  id: number;
  property_id: string | null;
  title: string;
  details: string | null;
  assignee: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  area: string | null;
  work_type: string | null;
  minutes: number | null;
  created_by: string | null;
}

interface TaskDraft {
  key: number;
  area: string;
  workType: string;
  title: string;
  details: string;
  assignee: string;
  minutes: string;
  priority: string;
  status: string;
}

const COLUMNS = TASK_STATUSES;

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-black/[0.06] text-muted",
};

const AUTHOR_STORAGE_KEY = "bmf-tasks-author";

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
}

function emptyDraft(key: number, assignee: string): TaskDraft {
  return {
    key,
    area: "",
    workType: "",
    title: "",
    details: "",
    assignee,
    minutes: "",
    priority: "medium",
    status: "open",
  };
}

function StepCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-white">
          {step}
        </span>
        <h2 className="card-title">{title}</h2>
      </div>
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
      <div className="mt-7">{children}</div>
    </section>
  );
}

function ChoiceChips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            value === option.value
              ? "border-foreground bg-foreground text-white"
              : "border-black/15 hover:bg-black/[0.04]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminTasksPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const [author, setAuthor] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [assignedDate, setAssignedDate] = useState(todayIso());
  const [confirmed, setConfirmed] = useState(false);
  const [drafts, setDrafts] = useState<TaskDraft[]>([emptyDraft(1, "")]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");

  useEffect(() => {
    const saved = window.localStorage.getItem(AUTHOR_STORAGE_KEY);
    if (saved && staff.some((member) => member.name === saved && member.role !== "Contractor")) {
      setAuthor(saved);
    }
  }, []);

  const chooseAuthor = (name: string) => {
    setAuthor(name);
    window.localStorage.setItem(AUTHOR_STORAGE_KEY, name);
    // Default unassigned tasks to whoever is filling the form in.
    setDrafts((current) =>
      current.map((draft) => (draft.assignee ? draft : { ...draft, assignee: name })),
    );
  };

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
  };

  const loadTasks = async () => {
    const res = await fetch("/api/tasks", { headers: { "x-admin-token": token } });
    if (!res.ok) {
      const data = await res.json();
      if (res.status === 401) {
        setAuthenticated(false);
        setError(REJECTED_TOKEN);
      } else {
        setError(data.error ?? "Couldn’t load tasks.");
      }
      setTasks(null);
      return;
    }
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setError(null);
  };

  useEffect(() => {
    if (!authenticated) return;
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const updateDraft = (key: number, changes: Partial<TaskDraft>) => {
    setDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...changes } : draft)),
    );
  };

  const addDraft = () => {
    setDrafts((current) => [
      ...current,
      emptyDraft(Math.max(...current.map((d) => d.key)) + 1, author),
    ]);
  };

  const removeDraft = (key: number) => {
    setDrafts((current) =>
      current.length === 1 ? current : current.filter((draft) => draft.key !== key),
    );
  };

  const filtered = useMemo(() => {
    return (tasks ?? []).filter(
      (task) =>
        (statusFilter === "all" || task.status === statusFilter) &&
        (personFilter === "all" || task.assignee === personFilter),
    );
  }, [tasks, statusFilter, personFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>(COLUMNS.map((c) => [c.value, []]));
    for (const task of filtered) map.get(task.status)?.push(task);
    return map;
  }, [filtered]);

  const overdueCount = (tasks ?? []).filter(
    (t) => t.status !== "done" && t.due_date && isoDate(t.due_date) < todayIso(),
  ).length;

  const readyDrafts = drafts.filter((draft) => draft.title.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(null);

    for (const draft of readyDrafts) {
      const minutes = draft.minutes.trim() ? Number(draft.minutes) : null;
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          propertyId: propertyId || null,
          title: draft.title.trim(),
          details: draft.details,
          assignee: draft.assignee || author,
          dueDate: assignedDate,
          priority: draft.priority,
          status: draft.status,
          area: draft.area,
          workType: draft.workType,
          minutes: minutes !== null && Number.isFinite(minutes) ? Math.round(minutes) : null,
          createdBy: author,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Couldn’t save that task.");
        setSaving(false);
        await loadTasks();
        return;
      }
    }

    setSaved(
      `${readyDrafts.length} task${readyDrafts.length === 1 ? "" : "s"} added to ${formatDate(assignedDate)}.`,
    );
    setDrafts([emptyDraft(1, author)]);
    setConfirmed(false);
    await loadTasks();
    setSaving(false);
  };

  const moveTask = async (task: Task, status: string) => {
    setError(null);
    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id: task.id, status }),
    });
    if (res.ok) await loadTasks();
    else setError("Couldn’t update that task.");
  };

  const removeTask = async (id: number) => {
    setError(null);
    const res = await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    });
    if (res.ok) await loadTasks();
    else setError("Couldn’t delete that task.");
  };

  if (!authenticated) {
    return (
      <AdminLogin
        token={token}
        onTokenChange={setToken}
        onSubmit={login}
        description="Enter the admin token to add and track property tasks."
        error={error}
      />
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <StepCard
        step={1}
        title="About this work"
        subtitle="Tasks appear on the operations calendar on the day they’re assigned."
      >
        <div className="space-y-7">
          <div>
            <span className="field-label">Who’s adding these tasks</span>
            <div className="mt-3">
              <ChoiceChips
                options={staff
                  .filter((member) => member.role !== "Contractor")
                  .map((member) => ({ value: member.name, label: member.name }))}
                value={author}
                onChange={chooseAuthor}
              />
            </div>
            {author && (
              <p className="mt-2 text-xs text-muted">
                {staff.find((member) => member.name === author)?.role}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="task-property">
                Site
              </label>
              <select
                id="task-property"
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
            <DateField
              id="task-date"
              label="Day assigned"
              value={assignedDate}
              onChange={setAssignedDate}
            />
          </div>
        </div>
      </StepCard>

      <StepCard step={2} title="Tasks" subtitle="Add as many tasks as you need for that day.">
        <div className="space-y-5">
          {drafts.map((draft, index) => (
            <div key={draft.key} className="rounded-2xl border border-black/10">
              <div className="flex items-center justify-between gap-3 rounded-t-2xl bg-black/[0.03] px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-brand/25 text-[11px] font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold">Task {index + 1}</p>
                </div>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDraft(draft.key)}
                    className="text-xs font-semibold text-muted hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor={`task-area-${draft.key}`}>
                    Area
                  </label>
                  <select
                    id={`task-area-${draft.key}`}
                    className="input"
                    value={draft.area}
                    onChange={(e) => updateDraft(draft.key, { area: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor={`task-work-type-${draft.key}`}>
                    Work type
                  </label>
                  <select
                    id={`task-work-type-${draft.key}`}
                    className="input"
                    value={draft.workType}
                    onChange={(e) => updateDraft(draft.key, { workType: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {WORK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor={`task-title-${draft.key}`}>
                    What needs doing
                  </label>
                  <input
                    id={`task-title-${draft.key}`}
                    className="input"
                    value={draft.title}
                    onChange={(e) => updateDraft(draft.key, { title: e.target.value })}
                    placeholder="e.g. Reduce hedge by 400mm along north boundary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor={`task-details-${draft.key}`}>
                    Extra detail (optional)
                  </label>
                  <textarea
                    id={`task-details-${draft.key}`}
                    className="input"
                    rows={2}
                    value={draft.details}
                    onChange={(e) => updateDraft(draft.key, { details: e.target.value })}
                    placeholder="Anything to prep or bring, access notes, who to call."
                  />
                </div>

                <div className="sm:col-span-2">
                  <span className="field-label">Assigned to</span>
                  <div className="mt-3">
                    <ChoiceChips
                      options={staff.map((member) => ({
                        value: member.name,
                        label: member.name,
                      }))}
                      value={draft.assignee}
                      onChange={(value) => updateDraft(draft.key, { assignee: value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label" htmlFor={`task-minutes-${draft.key}`}>
                    Time allowed (minutes)
                  </label>
                  <input
                    id={`task-minutes-${draft.key}`}
                    className="input"
                    type="number"
                    min={0}
                    step={5}
                    value={draft.minutes}
                    onChange={(e) => updateDraft(draft.key, { minutes: e.target.value })}
                    placeholder="90"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor={`task-priority-${draft.key}`}>
                    Priority
                  </label>
                  <select
                    id={`task-priority-${draft.key}`}
                    className="input"
                    value={draft.priority}
                    onChange={(e) => updateDraft(draft.key, { priority: e.target.value })}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor={`task-status-${draft.key}`}>
                    Status
                  </label>
                  <select
                    id={`task-status-${draft.key}`}
                    className="input"
                    value={draft.status}
                    onChange={(e) => updateDraft(draft.key, { status: e.target.value })}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addDraft}
            className="rounded-xl border border-dashed border-black/25 px-4 py-2 text-sm font-semibold text-muted hover:border-foreground hover:text-foreground"
          >
            + Add another task
          </button>
        </div>
      </StepCard>

      <section className="card">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>
            I confirm these tasks are correct and should be scheduled for{" "}
            <strong>{formatDate(assignedDate)}</strong>.
          </span>
        </label>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5">
          <p className="text-sm text-muted">
            {overdueCount > 0
              ? `${overdueCount} task${overdueCount === 1 ? "" : "s"} overdue.`
              : "Nothing overdue."}
          </p>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !confirmed || !author || readyDrafts.length === 0}
          >
            {saving
              ? "Saving…"
              : `Add ${readyDrafts.length || ""} task${readyDrafts.length === 1 ? "" : "s"}`.trim()}
          </button>
        </div>

        {saved && (
          <p className="mt-6 rounded-xl border border-green-700/20 bg-green-700/10 px-4 py-3 text-sm text-green-800">
            {saved}
          </p>
        )}
        {error && (
          <p className="mt-6 rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="card-title">Task board</h2>
            <p className="card-subtitle">Everything assigned, grouped by where it’s up to.</p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="field-label" htmlFor="task-person-filter">
                Person
              </label>
              <select
                id="task-person-filter"
                className="input"
                value={personFilter}
                onChange={(e) => setPersonFilter(e.target.value)}
              >
                <option value="all">Everyone</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="task-status-filter">
                Status
              </label>
              <select
                id="task-status-filter"
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {tasks === null ? (
          <p className="mt-8 text-sm text-muted">Loading tasks…</p>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {COLUMNS.map((column) => {
              const columnTasks = grouped.get(column.value) ?? [];
              return (
                <div key={column.value} className="rounded-2xl border border-black/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{column.label}</h3>
                    <span className="rounded-full bg-black/[0.06] px-2.5 py-1 text-xs font-semibold text-muted tabular-nums">
                      {columnTasks.length}
                    </span>
                  </div>

                  {columnTasks.length === 0 ? (
                    <p className="mt-5 text-sm text-muted">Nothing here.</p>
                  ) : (
                    <ul className="mt-5 space-y-3">
                      {columnTasks.map((task) => {
                        const overdue =
                          task.status !== "done" &&
                          task.due_date &&
                          isoDate(task.due_date) < todayIso();
                        return (
                          <li key={task.id} className="rounded-xl border border-black/10 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold">{task.title}</p>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                                  PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.low
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>

                            {(task.area || task.work_type) && (
                              <p className="mt-2 text-xs text-muted">
                                {[task.area, task.work_type].filter(Boolean).join(" · ")}
                              </p>
                            )}
                            {task.details && (
                              <p className="mt-2 text-sm text-muted">{task.details}</p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                              {task.due_date && (
                                <span className={overdue ? "font-semibold text-red-600" : ""}>
                                  {formatDate(task.due_date)}
                                </span>
                              )}
                              {task.assignee && (
                                <span className="flex items-center gap-1.5">
                                  <span className="flex size-5 items-center justify-center rounded-full bg-brand/20 text-[9px] font-semibold">
                                    {staffInitials(task.assignee)}
                                  </span>
                                  {task.assignee}
                                </span>
                              )}
                              {task.minutes != null && <span>{formatMinutes(task.minutes)}</span>}
                              <span>
                                {task.property_id
                                  ? properties[task.property_id]?.name
                                  : "Whole farm"}
                              </span>
                            </div>

                            {task.created_by && task.created_by !== task.assignee && (
                              <p className="mt-2 text-xs text-muted">Added by {task.created_by}</p>
                            )}

                            <div className="mt-4 flex flex-wrap gap-3 border-t border-black/10 pt-3 text-xs font-semibold">
                              {COLUMNS.filter((c) => c.value !== task.status).map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => moveTask(task, c.value)}
                                  className="hover:underline"
                                >
                                  Move to {statusLabel(c.value).toLowerCase()}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => removeTask(task.id)}
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </form>
  );
}
