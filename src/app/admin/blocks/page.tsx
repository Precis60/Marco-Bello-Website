"use client";

import { useEffect, useState } from "react";

import { AdminTabs } from "@/components/AdminTabs";
import { properties } from "@/lib/properties";

interface BlockedRange {
  id: number;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}

interface SetResult {
  ok: boolean;
  message: string;
}

export default function AdminBlocksPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [propertyId, setPropertyId] = useState<string>("main-house");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [blocks, setBlocks] = useState<BlockedRange[] | null>(null);

  const [result, setResult] = useState<SetResult | null>(null);
  const [loading, setLoading] = useState(false);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticated(true);
  };

  const loadBlocks = async () => {
    const res = await fetch(`/api/blocks?propertyId=${propertyId}`);
    const data = await res.json();
    setBlocks(data.blocks ?? []);
  };

  useEffect(() => {
    if (!authenticated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, propertyId]);

  const addBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        propertyId,
        startDate: start,
        endDate: end,
        reason: reason || undefined,
      }),
    });

    if (res.ok) {
      setResult({ ok: true, message: `Dates blocked for ${properties[propertyId].name}.` });
      setStart("");
      setEnd("");
      setReason("");
      await loadBlocks();
    } else {
      const data = await res.json();
      setResult({ ok: false, message: data.error ?? "Failed to block dates." });
    }
    setLoading(false);
  };

  const removeBlock = async (id: number) => {
    setResult(null);
    const res = await fetch("/api/blocks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    });

    if (res.ok) {
      await loadBlocks();
      setResult({ ok: true, message: "Block removed." });
    } else {
      const data = await res.json();
      setResult({ ok: false, message: data.error ?? "Failed to remove block." });
    }
  };

  if (!authenticated) {
    return (
      <div className="py-16 sm:py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-black/10 bg-surface p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Admin login</h1>
          <p className="mt-2 text-sm text-foreground">Enter the admin token to manage unavailable dates.</p>
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
      <div className="mx-auto max-w-2xl space-y-6">
        <AdminTabs />
        <div className="rounded-2xl border border-black/10 bg-surface p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Block unavailable dates</h1>
          <p className="mt-2 text-sm text-foreground">
            Mark date ranges when a property should not be bookable. These dates are blocked
            immediately and will also prevent guests from paying for those nights.
          </p>

          <form onSubmit={addBlock} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
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
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-foreground">Reason (optional)</label>
              <input
                className="input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. maintenance"
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
                {loading ? "Saving…" : "Block dates"}
              </button>
            </div>
          </form>

          {result && (
            <p className={`mt-4 text-sm ${result.ok ? "text-green-700" : "text-red-600"}`}>{result.message}</p>
          )}
        </div>

        <div className="rounded-2xl border border-black/10 bg-surface p-6">
          <h2 className="text-xl font-semibold tracking-tight">Existing blocked dates</h2>

          {blocks === null ? (
            <p className="mt-4 text-sm text-foreground">Loading…</p>
          ) : blocks.length === 0 ? (
            <p className="mt-4 text-sm text-foreground">No blocked dates for {properties[propertyId].name}.</p>
          ) : (
            <div className="mt-4 overflow-auto rounded-xl border border-black/10">
              <table className="w-full text-sm">
                <thead className="bg-black/5 text-left text-xs uppercase text-foreground">
                  <tr>
                    <th className="p-3">Start</th>
                    <th className="p-3">End</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((b) => (
                    <tr key={b.id} className="border-t border-black/10">
                      <td className="p-3">{b.start_date}</td>
                      <td className="p-3">{b.end_date}</td>
                      <td className="p-3">{b.reason ?? "—"}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeBlock(b.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
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
  );
}
