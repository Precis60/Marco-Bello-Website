export interface InvoiceItem {
  description: string;
  qty: number;
  unit_price_cents: number;
  /** GST is charged on the line unless it is a GST-free item. */
  taxable: boolean;
}

export const GST_RATE = 0.1;

export const ESTATE = {
  name: "Bello Marco Estate",
  addressLines: ["Bello Marco Estate", "275 Founds Road", "DRYSDALE VIC 3222"],
};

/** Prefilled on new invoices; each invoice stores its own copy so it can differ. */
export const DEFAULT_PAYMENT = {
  accountName: "Bello Marco Estate\nM S  Estate Administrator",
  bsb: "063-114",
  accountNo: "1060 9124",
};

export const INVOICE_STATUSES = ["draft", "sent", "paid", "cancelled"] as const;

export function lineAmountCents(item: InvoiceItem): number {
  return Math.round(item.qty * item.unit_price_cents);
}

export function lineGstCents(item: InvoiceItem): number {
  return item.taxable ? Math.round(lineAmountCents(item) * GST_RATE) : 0;
}

export function invoiceTotals(items: InvoiceItem[]): {
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
} {
  const subtotalCents = items.reduce((sum, item) => sum + lineAmountCents(item), 0);
  const gstCents = items.reduce((sum, item) => sum + lineGstCents(item), 0);
  return { subtotalCents, gstCents, totalCents: subtotalCents + gstCents };
}

/** Sequential number for the current year, e.g. BM-2026-004. */
export function nextInvoiceNumber(existing: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `BM-${year}-`;
  const highest = existing.reduce((max, no) => {
    if (!no.startsWith(prefix)) return max;
    const n = Number(no.slice(prefix.length));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `${prefix}${`${highest + 1}`.padStart(3, "0")}`;
}
