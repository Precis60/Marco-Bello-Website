"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLogin } from "@/components/AdminLogin";
import { DateField } from "@/components/DateField";
import { formatDate, isoDate } from "@/lib/format";
import { properties } from "@/lib/properties";

interface Task {
  id: number;
  property_id: string | null;
  title: string;
  details: string | null;
  assignee: string | null;
  due_date: string | null;
  priority: string;
  status: string;
}

const PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const COLUMNS = [
  { status: "open", label: "To do" },
  { status: "in-progress", label: "In progress" },
  { status: "done", label: "Done" },
];

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-black/[0.06] text-muted",
};

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
}

export default function AdminTasksPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [propertyId, setPropertyId] = useState("");
  const [saving, setSaving] = useState(false);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
  };

  const loadTasks = async () => {
    const res = await fetch("/api/tasks", { headers: { "x-admin-token": token } });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Couldn’t load tasks.");
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

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>(COLUMNS.map((c) => [c.status, []]));
    for (const task of tasks ?? []) {
      map.get(task.status)?.push(task);
    }
    return map;
  }, [tasks]);

  const overdueCount = (tasks ?? []).filter(
    (t) => t.status !== "done" && t.due_date && isoDate(t.due_date) < todayIso(),
  ).length;

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId: propertyId || null,
        title,
        details,
        assignee,
        dueDate: dueDate || null,
        priority,
      }),
    });

    if (res.ok) {
      setTitle("");
      setDetails("");
      setDueDate("");
      await loadTasks();
    } else {
      const data = await res.json();
      setError(data.error ?? "Couldn’t save that task.");
    }
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
        description="Enter the admin token to manage property tasks."
        error={error}
      />
    );
  }

  return (
    <>
      <section className="card">
        <h2 className="card-title">Add a task</h2>
        <p className="card-subtitle">
          Keep maintenance, turnovers and follow-ups in one place. Tasks move between To do, In
          progress and Done.
        </p>

        <form onSubmit={addTask} className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="task-title">
              Task
            </label>
            <input
              id="task-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Service the ride-on mower"
              required
            />
          </div>
          <DateField
            id="task-due"
            label="Due date (optional)"
            value={dueDate}
            onChange={setDueDate}
            placeholder="No due date"
          />
          <div>
            <label className="field-label" htmlFor="task-priority">
              Priority
            </label>
            <select
              id="task-priority"
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="task-assignee">
              Assigned to (optional)
            </label>
            <input
              id="task-assignee"
              className="input"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="e.g. Jamie"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="task-property">
              Applies to
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
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="task-details">
              Notes (optional)
            </label>
            <textarea
              id="task-details"
              className="input"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5 sm:col-span-2">
            <p className="text-sm text-muted">
              {overdueCount > 0
                ? `${overdueCount} task${overdueCount === 1 ? "" : "s"} overdue.`
                : "Nothing overdue."}
            </p>
            <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
              {saving ? "Saving…" : "Add task"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-6 rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      {tasks === null ? (
        <section className="card">
          <p className="text-sm text-muted">Loading tasks…</p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((column) => {
            const columnTasks = grouped.get(column.status) ?? [];
            return (
              <section key={column.status} className="card">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="card-title">{column.label}</h2>
                  <span className="rounded-full bg-black/[0.06] px-2.5 py-1 text-xs font-semibold text-muted tabular-nums">
                    {columnTasks.length}
                  </span>
                </div>

                {columnTasks.length === 0 ? (
                  <p className="mt-6 text-sm text-muted">Nothing here.</p>
                ) : (
                  <ul className="mt-6 space-y-3">
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

                          {task.details && (
                            <p className="mt-2 text-sm text-muted">{task.details}</p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                            {task.due_date && (
                              <span className={overdue ? "font-semibold text-red-600" : ""}>
                                Due {formatDate(task.due_date)}
                              </span>
                            )}
                            {task.assignee && <span>{task.assignee}</span>}
                            <span>
                              {task.property_id ? properties[task.property_id]?.name : "Whole farm"}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3 border-t border-black/10 pt-3 text-xs font-semibold">
                            {COLUMNS.filter((c) => c.status !== task.status).map((c) => (
                              <button
                                key={c.status}
                                onClick={() => moveTask(task, c.status)}
                                className="hover:underline"
                              >
                                Move to {c.label.toLowerCase()}
                              </button>
                            ))}
                            <button
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
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
