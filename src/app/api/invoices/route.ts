import { NextRequest, NextResponse } from "next/server";

import { managementGuard } from "@/lib/adminAuth";
import {
  createInvoice,
  deleteInvoice,
  getInvoices,
  updateInvoice,
  type InvoiceInput,
} from "@/lib/db";
import { INVOICE_STATUSES, type InvoiceItem } from "@/lib/invoices";

interface InvoiceBody {
  token?: string;
  id?: number;
  invoiceNo?: string;
  invoiceDate?: string;
  dueDate?: string | null;
  billTo?: string;
  reference?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactWeb?: string | null;
  accountName?: string | null;
  bsb?: string | null;
  accountNo?: string | null;
  notes?: string | null;
  status?: string;
  items?: unknown;
}

function parseItems(value: unknown): InvoiceItem[] | null {
  if (!Array.isArray(value)) return null;
  const items: InvoiceItem[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) return null;
    const item = raw as Record<string, unknown>;
    const description = typeof item.description === "string" ? item.description.trim() : "";
    const qty = Number(item.qty);
    const unitPriceCents = Number(item.unit_price_cents);
    if (!description) continue;
    if (!Number.isFinite(qty) || !Number.isFinite(unitPriceCents)) return null;
    items.push({
      description,
      qty,
      unit_price_cents: Math.round(unitPriceCents),
      taxable: item.taxable !== false,
    });
  }
  return items;
}

function parseInvoice(body: InvoiceBody): InvoiceInput | string {
  const invoiceNo = body.invoiceNo?.trim();
  const invoiceDate = body.invoiceDate?.trim();
  if (!invoiceNo) return "Enter an invoice number.";
  if (!invoiceDate) return "Choose an invoice date.";

  const status = body.status?.trim() || "draft";
  if (!INVOICE_STATUSES.includes(status as (typeof INVOICE_STATUSES)[number])) {
    return "Unknown invoice status.";
  }

  const items = parseItems(body.items ?? []);
  if (!items) return "Check the line items.";
  if (items.length === 0) return "Add at least one line item.";

  return {
    invoiceNo,
    invoiceDate,
    dueDate: body.dueDate?.trim() || null,
    billTo: body.billTo?.trim() ?? "",
    reference: body.reference?.trim() || null,
    contactPhone: body.contactPhone?.trim() || null,
    contactEmail: body.contactEmail?.trim() || null,
    contactWeb: body.contactWeb?.trim() || null,
    accountName: body.accountName?.trim() || null,
    bsb: body.bsb?.trim() || null,
    accountNo: body.accountNo?.trim() || null,
    notes: body.notes?.trim() || null,
    status,
    items,
  };
}

async function readBody(request: NextRequest): Promise<InvoiceBody | null> {
  try {
    return (await request.json()) as InvoiceBody;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const denied = managementGuard(request.headers.get("x-admin-token"), "invoices");
  if (denied) return denied;

  try {
    const invoices = await getInvoices();
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Failed to load invoices", error);
    return NextResponse.json({ error: "Couldn’t load invoices." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const denied = managementGuard(body.token, "invoices");
  if (denied) return denied;

  const invoice = parseInvoice(body);
  if (typeof invoice === "string") {
    return NextResponse.json({ error: invoice }, { status: 400 });
  }

  try {
    const id = await createInvoice(invoice);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("Failed to create invoice", error);
    return NextResponse.json({ error: "Couldn’t save that invoice." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const denied = managementGuard(body.token, "invoices");
  if (denied) return denied;

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const invoice = parseInvoice(body);
  if (typeof invoice === "string") {
    return NextResponse.json({ error: invoice }, { status: 400 });
  }

  try {
    await updateInvoice(body.id, invoice);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update invoice", error);
    return NextResponse.json({ error: "Couldn’t update that invoice." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const denied = managementGuard(body.token, "invoices");
  if (denied) return denied;

  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await deleteInvoice(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete invoice", error);
    return NextResponse.json({ error: "Couldn’t delete that invoice." }, { status: 500 });
  }
}
