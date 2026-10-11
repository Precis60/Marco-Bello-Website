export function PhotoPlaceholder({
  label,
  aspect = "aspect-[16/10]",
}: {
  label: string;
  aspect?: string;
}) {
  return (
    <div
      className={`${aspect} flex items-end rounded-2xl border border-dashed border-black/20 bg-black/[0.03] p-4`}
    >
      <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-muted">
        Photography to come — {label}
      </p>
    </div>
  );
}

export function IndicativeTag() {
  return (
    <span className="inline-flex items-center rounded-full border border-black/15 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase text-muted">
      Indicative
    </span>
  );
}

export function FactGrid({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-2xl border border-black/10 bg-surface px-5 py-4">
          <dt className="text-[11px] font-semibold tracking-[0.16em] uppercase text-muted">
            {fact.label}
          </dt>
          <dd className="mt-2 text-sm leading-6">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RateTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-surface">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-black/10 text-[11px] font-semibold tracking-[0.14em] uppercase text-muted">
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-black/5 last:border-0">
              {row.map((cell, index) => (
                <td key={`${row[0]}-${index}`} className="px-4 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LevyNote() {
  return (
    <p className="text-sm leading-6 text-muted">
      The Victorian 7.5% short stay levy applies to stays under 28 days. It is
      not included in the prices or totals on this page.
    </p>
  );
}
