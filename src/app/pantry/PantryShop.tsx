"use client";

import { useMemo, useState, type FormEvent } from "react";

import { IndicativeTag } from "@/components/PhotoPlaceholder";
import { PANTRY_GROUPS, PANTRY_RULES, type PricedOffer } from "@/lib/catalogue";
import { assignLocation } from "@/lib/navigate";
import { formatAud } from "@/lib/rates";
import { EMAIL } from "@/lib/site";

const ITEMS = PANTRY_GROUPS.flatMap((group) => group.items);

export function PantryShop() {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dates, setDates] = useState("");
  const [note, setNote] = useState("");
  const [hint, setHint] = useState(false);

  const lines = useMemo(
    () =>
      ITEMS.flatMap((item) => {
        const count = qty[item.id] ?? 0;
        return count > 0 ? [{ item, count }] : [];
      }),
    [qty],
  );

  const pricedTotal = lines.reduce((sum, line) => {
    if (line.item.fromPrice == null) return sum;
    return sum + line.item.fromPrice * line.count;
  }, 0);
  const hasUnpriced = lines.some((line) => line.item.fromPrice == null);
  const stocking =
    pricedTotal > 0 && pricedTotal < PANTRY_RULES.stockingWaivedOver ? PANTRY_RULES.stockingFee : 0;
  const indicative = pricedTotal + stocking;
  const pricedLinesMeetMinimum = pricedTotal >= PANTRY_RULES.minimum;
  const canSend = lines.length > 0 && name.trim() && email.trim() && (pricedLinesMeetMinimum || hasUnpriced);

  const setCount = (id: string, next: number) => {
    setQty((current) => ({ ...current, [id]: Math.max(0, next) }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;
    const itemLines = lines
      .map((line) => {
        const price =
          line.item.fromPrice == null
            ? "price on request"
            : `${formatAud(line.item.fromPrice)} indicative from-price × ${line.count}`;
        return `- ${line.count} × ${line.item.name} (${price})`;
      })
      .join("\n");
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "—"}`,
      `Stay dates: ${dates || "—"}`,
      "",
      "Pre-arrival pantry request (indicative, not a payment):",
      itemLines,
      "",
      `Indicative from-total of priced lines: ${formatAud(pricedTotal)}`,
      stocking > 0
        ? `Stocking fee: ${formatAud(stocking)} (waived at ${formatAud(PANTRY_RULES.stockingWaivedOver)} and over)`
        : `Stocking fee: waived if the confirmed order is ${formatAud(PANTRY_RULES.stockingWaivedOver)} or more`,
      `Minimum order: ${formatAud(PANTRY_RULES.minimum)}`,
      PANTRY_RULES.cutoff,
      "",
      note || "",
    ].join("\n");
    setHint(true);
    assignLocation(`mailto:${EMAIL}?subject=${encodeURIComponent(`Pantry request from ${name}`)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-10">
        {PANTRY_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-2xl font-semibold tracking-tight">{group.title}</h2>
            <div className="mt-4 grid gap-4">
              {group.items.map((item) => (
                <PantryRow
                  key={item.id}
                  item={item}
                  count={qty[item.id] ?? 0}
                  onChange={(next) => setCount(item.id, next)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <form onSubmit={submit} className="h-fit rounded-2xl border border-black/10 bg-surface p-6 lg:sticky lg:top-24">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Your request</h2>
          <IndicativeTag />
        </div>
        {lines.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Add hampers, packs or produce. Nothing is charged here.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {lines.map((line) => (
              <li key={line.item.id} className="flex justify-between gap-3">
                <span>
                  {line.count} × {line.item.name}
                </span>
                <span className="text-muted">
                  {line.item.fromPrice == null ? "On request" : formatAud(line.item.fromPrice * line.count)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <dl className="mt-4 space-y-1 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt>Priced lines, from</dt>
            <dd>{formatAud(pricedTotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Stocking fee</dt>
            <dd>{stocking > 0 ? formatAud(stocking) : "Waived at $400+"}</dd>
          </div>
          <div className="flex justify-between gap-3 font-medium">
            <dt>Indicative total</dt>
            <dd>{formatAud(indicative)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-muted">
          From-prices only. We confirm the order before you pay. {formatAud(PANTRY_RULES.minimum)} minimum.
          A {formatAud(PANTRY_RULES.stockingFee)} stocking fee is waived at {formatAud(PANTRY_RULES.stockingWaivedOver)} and over.
          {hasUnpriced ? " Items without a price are confirmed in the reply and count toward the minimum." : ""}
        </p>
        {!pricedLinesMeetMinimum && lines.length > 0 && !hasUnpriced && (
          <p className="mt-2 text-xs text-muted">
            Add a little more to reach the {formatAud(PANTRY_RULES.minimum)} minimum.
          </p>
        )}

        <div className="mt-5 grid gap-3">
          <label className="text-xs font-semibold tracking-[0.16em] uppercase text-muted" htmlFor="pantry-name">
            Name
          </label>
          <input id="pantry-name" className="input mt-0" value={name} onChange={(e) => setName(e.target.value)} required />
          <label className="text-xs font-semibold tracking-[0.16em] uppercase text-muted" htmlFor="pantry-email">
            Email
          </label>
          <input id="pantry-email" className="input mt-0" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="text-xs font-semibold tracking-[0.16em] uppercase text-muted" htmlFor="pantry-phone">
            Phone
          </label>
          <input id="pantry-phone" className="input mt-0" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <label className="text-xs font-semibold tracking-[0.16em] uppercase text-muted" htmlFor="pantry-dates">
            Stay dates
          </label>
          <input id="pantry-dates" className="input mt-0" value={dates} onChange={(e) => setDates(e.target.value)} placeholder="Check-in date" />
          <label className="text-xs font-semibold tracking-[0.16em] uppercase text-muted" htmlFor="pantry-note">
            Notes
          </label>
          <textarea id="pantry-note" className="input mt-0 min-h-24" value={note} onChange={(e) => setNote(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={!canSend}>
            Send pantry request
          </button>
          <p className="text-xs leading-5 text-muted">
            Opens an email to {EMAIL}. This is a request, not a payment, and it is separate from your stay.
          </p>
          {hint && <p className="text-xs text-muted">If your email app did not open, write to {EMAIL}.</p>}
        </div>
      </form>
    </div>
  );
}

function PantryRow({
  item,
  count,
  onChange,
}: {
  item: PricedOffer;
  count: number;
  onChange: (next: number) => void;
}) {
  return (
    <article className="rounded-2xl border border-black/10 bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{item.name}</h3>
            <IndicativeTag />
          </div>
          <p className="mt-1 text-sm font-medium">{item.priceLabel}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-secondary h-10 px-3" onClick={() => onChange(count - 1)} aria-label={`Remove one ${item.name}`}>
            −
          </button>
          <span className="w-6 text-center text-sm tabular-nums">{count}</span>
          <button type="button" className="btn btn-secondary h-10 px-3" onClick={() => onChange(count + 1)} aria-label={`Add one ${item.name}`}>
            +
          </button>
        </div>
      </div>
    </article>
  );
}
