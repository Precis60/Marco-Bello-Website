"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminLogin, REJECTED_TOKEN } from "@/components/AdminLogin";
import { DateField } from "@/components/DateField";
import { InvoiceSheet, type InvoiceSheetData } from "@/components/InvoiceSheet";
import { formatCents, formatDate, isoDate } from "@/lib/format";
import {
  DEFAULT_PAYMENT,
  INVOICE_STATUSES,
  invoiceTotals,
  nextInvoiceNumber,
  type InvoiceItem,
} from "@/lib/invoices";

interface Invoice {
  id: number;
  invoice_no: string;
  invoice_date: string;
  due_date: string | null;
  bill_to: string;
  reference: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_web: string | null;
  account_name: string | null;
  bsb: string | null;
  account_no: string | null;
  notes: string | null;
  status: string;
  items: InvoiceItem[];
}

interface ItemDraft {
  description: string;
  qty: string;
  unitPrice: string;
  taxable: boolean;
}

const emptyItem: ItemDraft = { description: "", qty: "1", unitPrice: "", taxable: true };

function toItems(drafts: ItemDraft[]): InvoiceItem[] {
  return drafts
    .filter((draft) => draft.description.trim() !== "")
    .map((draft) => ({
      description: draft.description.trim(),
      qty: Number(draft.qty) || 0,
      unit_price_cents: Math.round((Number(draft.unitPrice) || 0) * 100),
      taxable: draft.taxable,
    }));
}

function toDrafts(items: InvoiceItem[]): ItemDraft[] {
  if (items.length === 0) return [{ ...emptyItem }];
  return items.map((item) => ({
    description: item.description,
    qty: `${item.qty}`,
    unitPrice: (item.unit_price_cents / 100).toFixed(2),
    taxable: item.taxable,
  }));
}

export default function AdminInvoicesPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(isoDate(new Date().toISOString()));
  const [dueDate, setDueDate] = useState("");
  const [billTo, setBillTo] = useState("");
  const [reference, setReference] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWeb, setContactWeb] = useState("");
  const [accountName, setAccountName] = useState(DEFAULT_PAYMENT.accountName);
  const [bsb, setBsb] = useState(DEFAULT_PAYMENT.bsb);
  const [accountNo, setAccountNo] = useState(DEFAULT_PAYMENT.accountNo);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("draft");
  const [drafts, setDrafts] = useState<ItemDraft[]>([{ ...emptyItem }]);

  const loadInvoices = async () => {
    const res = await fetch("/api/invoices", { headers: { "x-admin-token": token } });
    if (!res.ok) {
      const data = await res.json();
      if (res.status === 401) {
        setAuthenticated(false);
        setError(REJECTED_TOKEN);
      } else {
        setError(data.error ?? "Couldn’t load invoices.");
      }
      setInvoices(null);
      return;
    }
    const data = await res.json();
    setInvoices((data.invoices ?? []) as Invoice[]);
    setError(null);
  };

  useEffect(() => {
    if (!authenticated) return;
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const items = useMemo(() => toItems(drafts), [drafts]);
  const totals = invoiceTotals(items);

  const preview: InvoiceSheetData = {
    invoiceNo,
    invoiceDate,
    dueDate: dueDate || null,
    billTo,
    reference: reference || null,
    contactPhone: contactPhone || null,
    contactEmail: contactEmail || null,
    contactWeb: contactWeb || null,
    accountName: accountName || null,
    bsb: bsb || null,
    accountNo: accountNo || null,
    notes: notes || null,
    items,
  };

  const resetForm = () => {
    setEditingId(null);
    setInvoiceNo(nextInvoiceNumber((invoices ?? []).map((invoice) => invoice.invoice_no)));
    setInvoiceDate(isoDate(new Date().toISOString()));
    setDueDate("");
    setBillTo("");
    setReference("");
    setNotes("");
    setStatus("draft");
    setAccountName(DEFAULT_PAYMENT.accountName);
    setBsb(DEFAULT_PAYMENT.bsb);
    setAccountNo(DEFAULT_PAYMENT.accountNo);
    setDrafts([{ ...emptyItem }]);
    setError(null);
  };

  const startEditing = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setInvoiceNo(invoice.invoice_no);
    setInvoiceDate(isoDate(invoice.invoice_date));
    setDueDate(invoice.due_date ? isoDate(invoice.due_date) : "");
    setBillTo(invoice.bill_to);
    setReference(invoice.reference ?? "");
    setContactPhone(invoice.contact_phone ?? "");
    setContactEmail(invoice.contact_email ?? "");
    setContactWeb(invoice.contact_web ?? "");
    setAccountName(invoice.account_name ?? "");
    setBsb(invoice.bsb ?? "");
    setAccountNo(invoice.account_no ?? "");
    setNotes(invoice.notes ?? "");
    setStatus(invoice.status);
    setDrafts(toDrafts(invoice.items ?? []));
    setError(null);
    document.getElementById("invoice-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const saveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/invoices", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        id: editingId ?? undefined,
        invoiceNo,
        invoiceDate,
        dueDate: dueDate || null,
        billTo,
        reference,
        contactPhone,
        contactEmail,
        contactWeb,
        accountName,
        bsb,
        accountNo,
        notes,
        status,
        items,
      }),
    });

    if (res.ok) {
      await loadInvoices();
      if (!editingId) resetForm();
    } else {
      const data = await res.json();
      setError(data.error ?? "Couldn’t save that invoice.");
    }
    setSaving(false);
  };

  const removeInvoice = async (id: number) => {
    setError(null);
    const res = await fetch("/api/invoices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    });
    if (res.ok) {
      if (editingId === id) resetForm();
      await loadInvoices();
    } else {
      setError("Couldn’t delete that invoice.");
    }
  };

  const updateDraft = (index: number, patch: Partial<ItemDraft>) => {
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  };

  if (!authenticated) {
    return (
      <AdminLogin
        token={token}
        onTokenChange={setToken}
        onSubmit={(e) => {
          e.preventDefault();
          setAuthenticated(true);
        }}
        description="Enter the admin token to raise and edit invoices."
        error={error}
      />
    );
  }

  return (
    <>
      <section className="card print:hidden" id="invoice-form">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="card-title">{editingId ? "Edit invoice" : "New invoice"}</h2>
            <p className="card-subtitle">
              Fill in the details, then use “Save as PDF” below to print the invoice on the estate
              letterhead. Saved invoices can be reopened and changed at any time.
            </p>
          </div>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Start a new invoice
            </button>
          )}
        </div>

        <form onSubmit={saveInvoice} className="mt-8 space-y-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="invoice-no">
                Invoice number
              </label>
              <input
                id="invoice-no"
                className="input"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. BM-2026-001"
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="invoice-status">
                Status
              </label>
              <select
                id="invoice-status"
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {INVOICE_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <DateField
              id="invoice-date"
              label="Invoice date"
              value={invoiceDate}
              onChange={setInvoiceDate}
            />
            <DateField
              id="invoice-due-date"
              label="Due date"
              value={dueDate}
              onChange={setDueDate}
            />
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="invoice-bill-to">
                Bill to
              </label>
              <textarea
                id="invoice-bill-to"
                className="input"
                rows={3}
                value={billTo}
                onChange={(e) => setBillTo(e.target.value)}
                placeholder={"Name\nCompany\nAddress"}
              />
            </div>
          </div>

          <div className="border-t border-black/10 pt-6">
            <h3 className="text-sm font-semibold tracking-wide">Line items</h3>
            <div className="mt-4 space-y-4">
              {drafts.map((draft, index) => (
                <div
                  key={index}
                  className="grid gap-4 rounded-xl border border-black/10 p-4 sm:grid-cols-[1fr_5rem_8rem_auto]"
                >
                  <div>
                    <label className="field-label" htmlFor={`item-description-${index}`}>
                      Description
                    </label>
                    <input
                      id={`item-description-${index}`}
                      className="input"
                      value={draft.description}
                      onChange={(e) => updateDraft(index, { description: e.target.value })}
                      placeholder="e.g. Olive harvest labour"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor={`item-qty-${index}`}>
                      Qty
                    </label>
                    <input
                      id={`item-qty-${index}`}
                      className="input"
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.qty}
                      onChange={(e) => updateDraft(index, { qty: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor={`item-price-${index}`}>
                      Unit price (ex GST)
                    </label>
                    <input
                      id={`item-price-${index}`}
                      className="input"
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.unitPrice}
                      onChange={(e) => updateDraft(index, { unitPrice: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                    <label className="flex items-center gap-2 text-sm text-muted">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--brand)]"
                        checked={draft.taxable}
                        onChange={(e) => updateDraft(index, { taxable: e.target.checked })}
                      />
                      GST
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-600 hover:underline"
                      onClick={() =>
                        setDrafts((current) =>
                          current.length === 1
                            ? [{ ...emptyItem }]
                            : current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 text-sm font-semibold hover:underline"
              onClick={() => setDrafts((current) => [...current, { ...emptyItem }])}
            >
              + Add line item
            </button>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-black/10 p-4">
                <p className="field-label">Subtotal (ex GST)</p>
                <p className="mt-2 text-lg font-semibold tabular-nums">
                  {formatCents(totals.subtotalCents)}
                </p>
              </div>
              <div className="rounded-xl border border-black/10 p-4">
                <p className="field-label">GST</p>
                <p className="mt-2 text-lg font-semibold tabular-nums">
                  {formatCents(totals.gstCents)}
                </p>
              </div>
              <div className="rounded-xl border border-black/10 p-4">
                <p className="field-label">Total (AUD)</p>
                <p className="mt-2 text-lg font-semibold tabular-nums">
                  {formatCents(totals.totalCents)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 border-t border-black/10 pt-6 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="invoice-phone">
                Phone (P)
              </label>
              <input
                id="invoice-phone"
                className="input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="invoice-email">
                Email (E)
              </label>
              <input
                id="invoice-email"
                className="input"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="invoice-web">
                Website (W)
              </label>
              <input
                id="invoice-web"
                className="input"
                value={contactWeb}
                onChange={(e) => setContactWeb(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="invoice-account-name">
                Account name
              </label>
              <textarea
                id="invoice-account-name"
                className="input"
                rows={2}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="invoice-bsb">
                BSB
              </label>
              <input
                id="invoice-bsb"
                className="input"
                value={bsb}
                onChange={(e) => setBsb(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="invoice-account-no">
                Account number
              </label>
              <input
                id="invoice-account-no"
                className="input"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="invoice-reference">
                Reference
              </label>
              <input
                id="invoice-reference"
                className="input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. BM-2026-001"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="invoice-notes">
                Notes (optional)
              </label>
              <input
                id="invoice-notes"
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shown under the payment details"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-black/10 pt-6">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => window.print()}
              disabled={items.length === 0}
            >
              Save as PDF
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !invoiceNo || !invoiceDate || items.length === 0}
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create invoice"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-6 rounded-xl border border-red-600/20 bg-red-600/10 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="card p-0 sm:p-0">
        <div className="border-b border-black/10 p-6 print:hidden sm:p-8">
          <h2 className="card-title">Preview</h2>
          <p className="card-subtitle">
            Exactly what “Save as PDF” prints. Choose “Save as PDF” as the printer destination.
          </p>
        </div>
        <div className="overflow-x-auto p-4 sm:p-8 print:p-0">
          <InvoiceSheet invoice={preview} />
        </div>
      </section>

      <section className="card print:hidden">
        <h2 className="card-title">Invoices</h2>
        <p className="card-subtitle">Select an invoice to edit it, then save your changes.</p>

        {invoices === null ? (
          <p className="mt-6 text-sm text-muted">Loading…</p>
        ) : invoices.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No invoices yet.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-black/10">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Due</th>
                  <th>Bill to</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className={editingId === invoice.id ? "bg-brand/[0.06]" : undefined}
                  >
                    <td className="font-semibold whitespace-nowrap">{invoice.invoice_no}</td>
                    <td className="whitespace-nowrap">{formatDate(invoice.invoice_date)}</td>
                    <td className="whitespace-nowrap text-muted">
                      {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                    </td>
                    <td className="text-muted">{invoice.bill_to.split("\n")[0] || "—"}</td>
                    <td className="text-right font-semibold tabular-nums">
                      {formatCents(invoiceTotals(invoice.items ?? []).totalCents)}
                    </td>
                    <td>
                      <span className="inline-flex rounded-full bg-black/[0.06] px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase text-muted">
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-3 whitespace-nowrap">
                        <button
                          onClick={() => startEditing(invoice)}
                          className="text-xs font-semibold hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeInvoice(invoice.id)}
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
