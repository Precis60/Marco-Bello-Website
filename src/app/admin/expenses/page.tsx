"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLogin, REJECTED_TOKEN } from "@/components/AdminLogin";
import { DateField } from "@/components/DateField";
import { MonthPicker } from "@/components/MonthPicker";
import { formatCents, formatDate, isoDate } from "@/lib/format";
import { properties } from "@/lib/properties";

interface Expense {
  id: number;
  property_id: string | null;
  date: string;
  category: string;
  vendor: string | null;
  description: string | null;
  amount_cents: number;
  paid: boolean;
}

const CATEGORIES = [
  "Maintenance",
  "Utilities",
  "Cleaning",
  "Supplies",
  "Contractor",
  "Rates & insurance",
  "Marketing",
  "Other",
];

export default function AdminExpensesPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(new Date());
  const [propertyFilter, setPropertyFilter] = useState("all");

  const [date, setDate] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [propertyId, setPropertyId] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState(false);
  const [saving, setSaving] = useState(false);

  const login = () => {
    setAuthenticated(true);
  };

  const loadExpenses = async () => {
    const res = await fetch("/api/expenses", { headers: { "x-admin-token": token } });
    if (!res.ok) {
      const data = await res.json();
      if (res.status === 401) {
        setAuthenticated(false);
        setError(REJECTED_TOKEN);
      } else {
        setError(data.error ?? "Couldn’t load expenses.");
      }
      setExpenses(null);
      return;
    }
    const data = await res.json();
    setExpenses(data.expenses ?? []);
    setError(null);
  };

  useEffect(() => {
    if (!authenticated) return;
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const visible = useMemo(() => {
    if (!expenses) return [];
    const prefix = `${month.getFullYear()}-${`${month.getMonth() + 1}`.padStart(2, "0")}`;
    return expenses.filter(
      (x) =>
        isoDate(x.date).startsWith(prefix) &&
        (propertyFilter === "all" ||
          (propertyFilter === "farm" ? x.property_id === null : x.property_id === propertyFilter)),
    );
  }, [expenses, month, propertyFilter]);

  const monthTotal = visible.reduce((sum, x) => sum + x.amount_cents, 0);
  const unpaidTotal = visible.filter((x) => !x.paid).reduce((sum, x) => sum + x.amount_cents, 0);
  const byCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const x of visible) totals.set(x.category, (totals.get(x.category) ?? 0) + x.amount_cents);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [visible]);

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId: propertyId || null,
        date,
        category,
        vendor,
        description,
        amount: Number(amount),
        paid,
      }),
    });

    if (res.ok) {
      setAmount("");
      setVendor("");
      setDescription("");
      setPaid(false);
      await loadExpenses();
    } else {
      const data = await res.json();
      setError(data.error ?? "Couldn’t save that expense.");
    }
    setSaving(false);
  };

  const togglePaid = async (expense: Expense) => {
    setError(null);
    const res = await fetch("/api/expenses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id: expense.id, paid: !expense.paid }),
    });
    if (res.ok) await loadExpenses();
    else setError("Couldn’t update that expense.");
  };

  const removeExpense = async (id: number) => {
    setError(null);
    const res = await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    });
    if (res.ok) await loadExpenses();
    else setError("Couldn’t delete that expense.");
  };

  if (!authenticated) {
    return (
      <AdminLogin
        token={token}
        onTokenChange={setToken}
        onSubmit={login}
        description="Enter the admin token to track property costs."
        error={error}
      />
    );
  }

  return (
    <>
      <section className="card">
        <h2 className="card-title">Record an expense</h2>
        <p className="card-subtitle">
          Log what the farm spends, per property or across the whole farm, and mark whether it has
          been paid.
        </p>

        <form onSubmit={addExpense} className="mt-8 grid gap-5 sm:grid-cols-2">
          <DateField id="expense-date" label="Date" value={date} onChange={setDate} />
          <div>
            <label className="field-label" htmlFor="expense-amount">
              Amount (AUD)
            </label>
            <input
              id="expense-amount"
              className="input"
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 480.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="expense-category">
              Category
            </label>
            <select
              id="expense-category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="expense-property">
              Applies to
            </label>
            <select
              id="expense-property"
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
          <div>
            <label className="field-label" htmlFor="expense-vendor">
              Supplier (optional)
            </label>
            <input
              id="expense-vendor"
              className="input"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Hunter Electrical"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="expense-description">
              Description (optional)
            </label>
            <input
              id="expense-description"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Replaced pump switch"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="size-4 accent-[var(--brand)]"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
              />
              Already paid
            </label>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !date || amount === ""}
            >
              {saving ? "Saving…" : "Add expense"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-6 rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="card-title">Spending</h2>
            <p className="card-subtitle">Expenses recorded in the selected month.</p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <MonthPicker month={month} onChange={setMonth} />
            <div>
              <label className="field-label" htmlFor="expense-filter">
                Property
              </label>
              <select
                id="expense-filter"
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

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-black/10 p-4">
            <p className="field-label">Total</p>
            <p className="mt-2 text-xl font-semibold tabular-nums">{formatCents(monthTotal)}</p>
          </div>
          <div className="rounded-xl border border-black/10 p-4">
            <p className="field-label">Unpaid</p>
            <p className="mt-2 text-xl font-semibold tabular-nums">{formatCents(unpaidTotal)}</p>
          </div>
          <div className="rounded-xl border border-black/10 p-4">
            <p className="field-label">Entries</p>
            <p className="mt-2 text-xl font-semibold tabular-nums">{visible.length}</p>
          </div>
        </div>

        {byCategory.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {byCategory.map(([name, cents]) => (
              <span
                key={name}
                className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold text-muted"
              >
                {name} · {formatCents(cents)}
              </span>
            ))}
          </div>
        )}

        {expenses === null ? (
          <p className="mt-6 text-sm text-muted">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No expenses recorded for this month.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-black/10">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Applies to</th>
                  <th>Detail</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((x) => (
                  <tr key={x.id}>
                    <td className="whitespace-nowrap">{formatDate(x.date)}</td>
                    <td>{x.category}</td>
                    <td className="text-muted">
                      {x.property_id ? properties[x.property_id]?.name : "Whole farm"}
                    </td>
                    <td className="text-muted">
                      {x.vendor && <div className="font-medium text-foreground">{x.vendor}</div>}
                      {x.description ?? (x.vendor ? null : "—")}
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {formatCents(x.amount_cents)}
                    </td>
                    <td>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${
                          x.paid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {x.paid ? "paid" : "unpaid"}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-3 whitespace-nowrap">
                        <button
                          onClick={() => togglePaid(x)}
                          className="text-xs font-semibold hover:underline"
                        >
                          {x.paid ? "Mark unpaid" : "Mark paid"}
                        </button>
                        <button
                          onClick={() => removeExpense(x.id)}
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
      </section>
    </>
  );
}
