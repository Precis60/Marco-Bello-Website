"use client";

import { useState } from "react";

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

  const [viewStart, setViewStart] = useState("");
  const [viewEnd, setViewEnd] = useState("");
  const [viewPrices, setViewPrices] = useState<{ date: string; price: number }[] | null>(null);

  const [result, setResult] = useState<SetResult | null>(null);
  const [loading, setLoading] = useState(false);

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
      setResult({ ok: true, message: `Prices set for ${properties[propertyId].name} from ${start} to ${end}.` });
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
    const res = await fetch(`/api/prices?propertyId=${propertyId}&start=${viewStart}&end=${viewEnd}`);
    const data = await res.json();
    setViewPrices(data.prices ?? []);
  };

  if (!authenticated) {
    return (
      <div className="py-16 sm:py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-black/10 bg-surface p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Admin login</h1>
          <p className="mt-2 text-sm text-foreground">Enter the admin token to manage daily prices.</p>
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
          {result && <p className="mt-4 text-xs text-red-600">{result.message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-black/10 bg-surface p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Set daily prices</h1>
          <p className="mt-2 text-sm text-foreground">
            Choose a property and a date range, then set the nightly price for each night in that range.
            Dates outside any set range fall back to the default price shown below.
          </p>

          <form onSubmit={setPrices} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">Property</label>
              <select
                className="input"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              >
                {Object.values(properties).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (default ${p.nightlyPrice})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">Nightly price ($)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">Start date</label>
              <input
                type="date"
                className="input"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">End date</label>
              <input
                type="date"
                className="input"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving…" : "Save prices"}
              </button>
            </div>
          </form>

          {result && (
            <p className={`mt-4 text-sm ${result.ok ? "text-green-700" : "text-red-600"}`}>{result.message}</p>
          )}
        </div>

        <div className="rounded-2xl border border-black/10 bg-surface p-6">
          <h2 className="text-xl font-semibold tracking-tight">View existing prices</h2>
          <form onSubmit={viewExisting} className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">Property</label>
              <select
                className="input"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              >
                {Object.values(properties).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">From</label>
              <input
                type="date"
                className="input"
                value={viewStart}
                onChange={(e) => setViewStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">To</label>
              <input
                type="date"
                className="input"
                value={viewEnd}
                onChange={(e) => setViewEnd(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn btn-secondary w-full">
                View
              </button>
            </div>
          </form>

          {viewPrices && (
            <div className="mt-6 max-h-80 overflow-auto rounded-xl border border-black/10">
              <table className="w-full text-sm">
                <thead className="bg-black/5 text-left text-xs uppercase text-foreground">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPrices.length === 0 ? (
                    <tr>
                      <td className="p-3 text-foreground" colSpan={2}>
                        No custom prices in this range. Default rates will apply.
                      </td>
                    </tr>
                  ) : (
                    viewPrices.map((p) => (
                      <tr key={p.date} className="border-t border-black/10">
                        <td className="p-3">{p.date}</td>
                        <td className="p-3">${p.price}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
