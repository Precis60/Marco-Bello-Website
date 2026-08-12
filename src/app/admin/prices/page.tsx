"use client";

import { useState } from "react";

import { AdminLogin } from "@/components/AdminLogin";
import { formatCurrency, formatDate, nightsBetween } from "@/lib/format";
import { properties } from "@/lib/properties";

interface SetResult {
  ok: boolean;
  message: string;
}

export default function AdminPricesPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [propertyId, setPropertyId] = useState<string>("main-house");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [price, setPrice] = useState<number | "">("");

  const [viewPropertyId, setViewPropertyId] = useState<string>("main-house");
  const [viewStart, setViewStart] = useState("");
  const [viewEnd, setViewEnd] = useState("");
  const [viewPrices, setViewPrices] = useState<{ date: string; price: number }[] | null>(null);
  const [viewing, setViewing] = useState(false);

  const [result, setResult] = useState<SetResult | null>(null);
  const [loading, setLoading] = useState(false);

  const nights = start && end ? nightsBetween(start, end) : 0;

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
  };

  const setPrices = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    const res = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId,
        startDate: start,
        endDate: end,
        price: Number(price),
      }),
    });

    if (res.ok) {
      setResult({
        ok: true,
        message: `${properties[propertyId].name} set to ${formatCurrency(Number(price))} per night for ${nights} night${nights === 1 ? "" : "s"} from ${formatDate(start)}.`,
      });
      setPrice("");
    } else {
      const data = await res.json();
      setResult({ ok: false, message: data.error ?? "Failed to set prices." });
    }
    setLoading(false);
  };

  const viewExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setViewPrices(null);
    setViewing(true);
    const res = await fetch(
      `/api/prices?propertyId=${viewPropertyId}&start=${viewStart}&end=${viewEnd}`,
    );
    const data = await res.json();
    setViewPrices(data.prices ?? []);
    setViewing(false);
  };

  if (!authenticated) {
    return (
      <AdminLogin
        token={token}
        onTokenChange={setToken}
        onSubmit={login}
        description="Enter the admin token to manage nightly rates."
      />
    );
  }

  return (
    <>
      <section className="card">
        <h2 className="card-title">Set nightly rates</h2>
        <p className="card-subtitle">
          Choose a property and a date range, then set the rate for every night in that range. The
          end date is the checkout day, so that night is not priced. Nights outside any set range
          use the property&apos;s default rate.
        </p>

        <form onSubmit={setPrices} className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="price-property">
              Property
            </label>
            <select
              id="price-property"
              className="input"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            >
              {Object.values(properties).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — default {formatCurrency(p.nightlyPrice)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="price-amount">
              Nightly rate (AUD)
            </label>
            <input
              id="price-amount"
              type="number"
              min={0}
              step={5}
              placeholder="e.g. 2250"
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="price-start">
              First night
            </label>
            <input
              id="price-start"
              type="date"
              className="input"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="price-end">
              Checkout date
            </label>
            <input
              id="price-end"
              type="date"
              min={start || undefined}
              className="input"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5 sm:col-span-2">
            <p className="text-sm text-muted">
              {nights > 0 && price !== ""
                ? `${nights} night${nights === 1 ? "" : "s"} · ${formatCurrency(Number(price) * nights)} total`
                : "Pick a range and a rate to see the total."}
            </p>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save rates"}
            </button>
          </div>
        </form>

        {result && (
          <p
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              result.ok
                ? "border-green-600/20 bg-green-600/10 text-green-800"
                : "border-red-600/20 bg-red-600/10 text-red-700"
            }`}
          >
            {result.message}
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Existing rates</h2>
        <p className="card-subtitle">
          Review the custom rates already saved for a property over a date range.
        </p>

        <form onSubmit={viewExisting} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="field-label" htmlFor="view-property">
              Property
            </label>
            <select
              id="view-property"
              className="input"
              value={viewPropertyId}
              onChange={(e) => setViewPropertyId(e.target.value)}
            >
              {Object.values(properties).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="view-start">
              From
            </label>
            <input
              id="view-start"
              type="date"
              className="input"
              value={viewStart}
              onChange={(e) => setViewStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="view-end">
              To
            </label>
            <input
              id="view-end"
              type="date"
              min={viewStart || undefined}
              className="input"
              value={viewEnd}
              onChange={(e) => setViewEnd(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn btn-secondary" disabled={viewing}>
              {viewing ? "Loading…" : "View rates"}
            </button>
          </div>
        </form>

        {viewPrices && (
          <div className="mt-6 max-h-96 overflow-auto rounded-xl border border-black/10">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="text-right">Nightly rate</th>
                </tr>
              </thead>
              <tbody>
                {viewPrices.length === 0 ? (
                  <tr>
                    <td className="text-muted" colSpan={2}>
                      No custom rates in this range — the default rate applies.
                    </td>
                  </tr>
                ) : (
                  viewPrices.map((p) => (
                    <tr key={p.date}>
                      <td className="whitespace-nowrap">{formatDate(p.date)}</td>
                      <td className="text-right font-medium tabular-nums">
                        {formatCurrency(p.price)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
