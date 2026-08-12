const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const centsFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

/** Formats an amount stored in cents, e.g. 125050 as "$1,250.50". */
export function formatCents(cents: number) {
  return centsFormatter.format(cents / 100);
}

/** Reduces a date string or ISO timestamp (as returned by the database) to `yyyy-mm-dd`. */
export function isoDate(value: string) {
  return value.slice(0, 10);
}

/** Formats a date string as e.g. "Fri 14 Aug 2026", ignoring time zones. */
export function formatDate(value: string) {
  const [year, month, day] = isoDate(value).split("-").map(Number);
  if (!year || !month || !day) return value;
  return dateFormatter.format(new Date(year, month - 1, day));
}

export function nightsBetween(startIso: string, endIso: string) {
  const start = new Date(`${isoDate(startIso)}T00:00:00`).getTime();
  const end = new Date(`${isoDate(endIso)}T00:00:00`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round((end - start) / 86_400_000);
}
