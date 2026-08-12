"use client";

import { useEffect, useState } from "react";

import { AdminLogin } from "@/components/AdminLogin";
import { formatDate } from "@/lib/format";
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
      setResult({
        ok: true,
        message: `Dates blocked for ${properties[propertyId].name}.`,
      });
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
      setResult({
        ok: false,
        message: data.error ?? "Failed to remove block.",
      });
    }
  };

  if (!authenticated) {
    return (
      <AdminLogin
        token={token}
        onTokenChange={setToken}
        onSubmit={login}
        description="Enter the admin token to manage unavailable dates."
      />
    );
  }

  return (
    <>
      <section className="card">
        <h2 className="card-title">Block unavailable dates</h2>
        <p className="card-subtitle">
          Mark date ranges when a property should not be bookable. These dates are blocked
          immediately and will also prevent guests from paying for those nights.
        </p>

        <form onSubmit={addBlock} className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="block-property">
              Property
            </label>
            <select
              id="block-property"
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
            <label className="field-label" htmlFor="block-reason">
              Reason (optional)
            </label>
            <input
              id="block-reason"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. maintenance"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="block-start">
              Start date
            </label>
            <input
              id="block-start"
              type="date"
              className="input"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="block-end">
              End date
            </label>
            <input
              id="block-end"
              type="date"
              min={start || undefined}
              className="input"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
          <div className="mt-2 flex justify-end border-t border-black/10 pt-5 sm:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Block dates"}
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
        <h2 className="card-title">Blocked dates</h2>
        <p className="card-subtitle">Ranges currently blocked for {properties[propertyId].name}.</p>

        {blocks === null ? (
          <p className="mt-6 text-sm text-muted">Loading…</p>
        ) : blocks.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Nothing blocked for this property.</p>
        ) : (
          <div className="mt-6 overflow-auto rounded-xl border border-black/10">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Start</th>
                  <th>End</th>
                  <th>Reason</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((b) => (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap">{formatDate(b.start_date)}</td>
                    <td className="whitespace-nowrap">{formatDate(b.end_date)}</td>
                    <td className="text-muted">{b.reason ?? "—"}</td>
                    <td className="text-right">
                      <button
                        onClick={() => removeBlock(b.id)}
                        className="text-xs font-semibold text-red-600 hover:underline"
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
      </section>
    </>
  );
}
