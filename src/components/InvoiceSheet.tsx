import Image from "next/image";

import { formatCents, formatDate } from "@/lib/format";
import {
  ESTATE,
  invoiceTotals,
  lineAmountCents,
  lineGstCents,
  type InvoiceItem,
} from "@/lib/invoices";

export interface InvoiceSheetData {
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string | null;
  billTo: string;
  reference: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWeb: string | null;
  accountName: string | null;
  bsb: string | null;
  accountNo: string | null;
  notes: string | null;
  items: InvoiceItem[];
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-28 shrink-0 text-[13px] text-[#3f4a3d]">{label}</span>
      <span className="min-w-0 flex-1 border-b border-[#c7c0ac] pb-1 text-[13px]">
        {value || "\u00a0"}
      </span>
    </div>
  );
}

/**
 * The Bello Marco Estate tax invoice, laid out for A4. Kept free of inputs so
 * the same markup is used for the on-screen preview and the printed PDF.
 */
export function InvoiceSheet({ invoice }: { invoice: InvoiceSheetData }) {
  const { subtotalCents, gstCents, totalCents } = invoiceTotals(invoice.items);
  const rows = [...invoice.items];
  while (rows.length < 5) {
    rows.push({ description: "", qty: 0, unit_price_cents: 0, taxable: false });
  }

  return (
    <div className="invoice-sheet mx-auto w-full max-w-[820px] bg-[#fdfbf6] p-8 text-[#20261e] sm:p-12">
      <Image
        src="/invoice-letterhead.jpg"
        alt=""
        width={1494}
        height={540}
        className="w-full"
        priority
      />

      <div className="mt-2 flex flex-wrap items-start justify-between gap-8">
        <div className="font-serif">
          <p className="text-4xl tracking-[0.06em] text-[#8a6f3c] sm:text-5xl">
            BELLO MARCO
          </p>
          <p className="mt-2 text-center text-lg tracking-[0.42em] text-[#8a6f3c] sm:text-xl">
            ESTATE
          </p>
        </div>
        <div className="min-w-[220px] text-[13px] leading-6">
          {ESTATE.addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <div className="mt-3 space-y-1.5">
            <Field label="P:" value={invoice.contactPhone} />
            <Field label="E:" value={invoice.contactEmail} />
            <Field label="W:" value={invoice.contactWeb} />
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-serif text-4xl tracking-wide text-[#2c3a2b]">TAX INVOICE</h2>

      <div className="mt-6 flex flex-wrap justify-between gap-10">
        <div className="min-w-[260px] flex-1">
          <p className="text-[13px]">Bill To:</p>
          <div className="mt-2 space-y-2">
            {(invoice.billTo.split("\n").length < 3
              ? [...invoice.billTo.split("\n"), "", ""].slice(0, 3)
              : invoice.billTo.split("\n")
            ).map((line, index) => (
              <p
                key={index}
                className="border-b border-[#c7c0ac] pb-1 text-[13px] whitespace-pre-wrap"
              >
                {line || "\u00a0"}
              </p>
            ))}
          </div>
        </div>
        <div className="min-w-[280px] space-y-2">
          <Field label="Invoice No:" value={invoice.invoiceNo} />
          <Field
            label="Invoice Date:"
            value={invoice.invoiceDate ? formatDate(invoice.invoiceDate) : null}
          />
          <Field label="Due Date:" value={invoice.dueDate ? formatDate(invoice.dueDate) : null} />
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-[#efe6d7] text-[11px] tracking-[0.14em] uppercase">
            <th className="border border-[#c7b9a0] px-3 py-3 text-left font-medium">Description</th>
            <th className="border border-[#c7b9a0] px-3 py-3 text-center font-medium">Qty</th>
            <th className="border border-[#c7b9a0] px-3 py-3 text-center font-medium">
              Unit price
              <span className="block text-[10px] tracking-normal normal-case">(ex GST)</span>
            </th>
            <th className="border border-[#c7b9a0] px-3 py-3 text-center font-medium">GST</th>
            <th className="border border-[#c7b9a0] px-3 py-3 text-center font-medium">
              Amount
              <span className="block text-[10px] tracking-normal normal-case">(ex GST)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={index}>
              <td className="border border-[#c7b9a0] px-3 py-2.5 whitespace-pre-wrap">
                {item.description || "\u00a0"}
              </td>
              <td className="border border-[#c7b9a0] px-3 py-2.5 text-center tabular-nums">
                {item.description ? item.qty : "\u00a0"}
              </td>
              <td className="border border-[#c7b9a0] px-3 py-2.5 text-right tabular-nums">
                {item.description ? formatCents(item.unit_price_cents) : "\u00a0"}
              </td>
              <td className="border border-[#c7b9a0] px-3 py-2.5 text-right tabular-nums">
                {item.description
                  ? item.taxable
                    ? formatCents(lineGstCents(item))
                    : "GST free"
                  : "\u00a0"}
              </td>
              <td className="border border-[#c7b9a0] px-3 py-2.5 text-right tabular-nums">
                {item.description ? formatCents(lineAmountCents(item)) : "\u00a0"}
              </td>
            </tr>
          ))}
          <tr>
            <td className="px-3 py-2.5" colSpan={2} />
            <td className="border border-[#c7b9a0] px-3 py-2.5" colSpan={2}>
              Subtotal (ex GST)
            </td>
            <td className="border border-[#c7b9a0] px-3 py-2.5 text-right tabular-nums">
              {formatCents(subtotalCents)}
            </td>
          </tr>
          <tr>
            <td className="px-3 py-2.5" colSpan={2} />
            <td className="border border-[#c7b9a0] px-3 py-2.5" colSpan={2}>
              GST (10%)
            </td>
            <td className="border border-[#c7b9a0] px-3 py-2.5 text-right tabular-nums">
              {formatCents(gstCents)}
            </td>
          </tr>
          <tr className="bg-[#efe6d7]">
            <td className="bg-transparent px-3 py-3" colSpan={2} />
            <td
              className="border border-[#c7b9a0] px-3 py-3 font-serif text-base font-semibold"
              colSpan={2}
            >
              TOTAL (AUD)
            </td>
            <td className="border border-[#c7b9a0] px-3 py-3 text-right font-serif text-base font-semibold tabular-nums">
              {formatCents(totalCents)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-10 text-[13px] leading-7">
        <p className="font-semibold">Payment Details:</p>
        <div className="mt-1 grid grid-cols-[7.5rem_1fr] gap-x-4">
          <span>Account Name:</span>
          <span className="whitespace-pre-line">{invoice.accountName || "\u00a0"}</span>
          <span>BSB:</span>
          <span>{invoice.bsb || "\u00a0"}</span>
          <span>Account No:</span>
          <span>{invoice.accountNo || "\u00a0"}</span>
          <span>Reference:</span>
          <span className="border-b border-[#c7c0ac]">{invoice.reference || "\u00a0"}</span>
        </div>
        {invoice.notes && <p className="mt-6 whitespace-pre-wrap text-[#3f4a3d]">{invoice.notes}</p>}
      </div>
    </div>
  );
}
