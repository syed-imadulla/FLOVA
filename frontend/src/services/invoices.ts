// =====================================================================
// FLOVA Invoice Intelligence Service (Owner: M1 / Phase 15)
// Manages uploaded invoices, receivables, payables, and partial settlements.
// Strictly read-only extraction and user-directed settlements.
// Invariant: Unpaid or expected invoices are NEVER counted as personal liquid cash.
// =====================================================================

import { supabase } from "../lib/supabase";
import { todayLocalISO } from "../data/dates";
import { toPaise } from "../lib/money";
import type {
  Invoice,
  InvoiceDirection,
  InvoiceSettlement,
  InvoiceStatus,
  RupeeString,
  Paise,
} from "../types/contracts";

export interface CreateInvoiceInput {
  direction: InvoiceDirection;
  supplierName?: string | null;
  customerName?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string;
  dueDate?: string | null;
  totalAmountRupees?: RupeeString;
  totalAmountPaise?: Paise;
  notes?: string | null;
  filePath?: string | null;
  items?: Array<{ name: string; quantity?: number; unitPrice?: RupeeString; amount: RupeeString }>;
}

export interface AddInvoiceSettlementInput {
  invoiceId?: string;
  amountRupees?: RupeeString;
  amountPaise?: Paise;
  settledAt?: string;
  notes?: string | null;
  paymentReference?: string | null;
  transactionId?: string | null;
  payoutId?: string | null;
}

/**
 * Lists all invoices for the authenticated user, optionally filtered by direction and status.
 */
export async function listInvoices(filters?: {
  direction?: InvoiceDirection;
  status?: InvoiceStatus;
} | InvoiceDirection): Promise<Invoice[]> {
  const normFilters = typeof filters === "string" ? { direction: filters } : filters;
  let query = supabase
    .from("invoices")
    .select("*, items:invoice_items(*), settlements:invoice_settlements(*)")
    .order("invoice_date", { ascending: false });

  if (normFilters?.direction) {
    query = query.eq("direction", normFilters.direction);
  }
  if (normFilters?.status) {
    query = query.eq("status", normFilters.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list invoices: ${error.message}`);
  }

  return (data || []) as Invoice[];
}

/**
 * Retrieves a single invoice with its line items and settlements.
 */
export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, items:invoice_items(*), settlements:invoice_settlements(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch invoice: ${error.message}`);
  }
  return data as Invoice | null;
}

/**
 * Creates a new invoice record with optional line items.
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const totalAmountPaise = input.totalAmountPaise ?? (input.totalAmountRupees ? toPaise(input.totalAmountRupees) : 0);
  if (totalAmountPaise <= 0) {
    throw new Error("Total invoice amount must be greater than zero.");
  }
  if (totalAmountPaise > 100000000) {
    throw new Error("Invoice total exceeds maximum limit of ₹10,00,000.");
  }

  const totalAmountStr = (totalAmountPaise / 100).toFixed(2);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error("You must be logged in to create an invoice.");
  }
  const userId = userData.user.id;

  const { data: invData, error: invError } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      direction: input.direction,
      supplier_name: input.supplierName || null,
      customer_name: input.customerName || null,
      invoice_number: input.invoiceNumber || null,
      invoice_date: input.invoiceDate || todayLocalISO(),
      due_date: input.dueDate || null,
      total_amount: totalAmountStr,
      paid_amount: "0.00",
      status: "unpaid",
      notes: input.notes || null,
      file_path: input.filePath || null,
    })
    .select()
    .single();

  if (invError || !invData) {
    throw new Error(`Failed to create invoice: ${invError?.message}`);
  }

  // Insert line items if provided
  if (input.items && input.items.length > 0) {
    const itemRows = input.items.map((it) => ({
      invoice_id: invData.id,
      name: it.name,
      quantity: it.quantity ?? null,
      unit_price: it.unitPrice ? (toPaise(it.unitPrice) / 100).toFixed(2) : null,
      amount: (toPaise(it.amount) / 100).toFixed(2),
    }));

    await supabase.from("invoice_items").insert(itemRows);
  }

  return getInvoice(invData.id) as Promise<Invoice>;
}

/**
 * Records a partial or full settlement payment against an invoice.
 * The database trigger automatically updates `invoices.paid_amount` and `invoices.status`.
 */
export async function addInvoiceSettlement(
  invoiceIdOrInput: string | AddInvoiceSettlementInput,
  maybeInput?: Partial<AddInvoiceSettlementInput>
): Promise<InvoiceSettlement> {
  const input: AddInvoiceSettlementInput =
    typeof invoiceIdOrInput === "string"
      ? { invoiceId: invoiceIdOrInput, ...maybeInput }
      : invoiceIdOrInput;

  const invoiceId = input.invoiceId;
  if (!invoiceId) throw new Error("Invoice ID is required");

  const amountPaise = input.amountPaise ?? (input.amountRupees ? toPaise(input.amountRupees) : 0);
  if (amountPaise <= 0) {
    throw new Error("Settlement amount must be greater than zero.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    throw new Error("You must be logged in to record a settlement.");
  }
  const userId = userData.user.id;

  const amountStr = (amountPaise / 100).toFixed(2);

  const { data, error } = await supabase
    .from("invoice_settlements")
    .insert({
      invoice_id: invoiceId,
      user_id: userId,
      amount: amountStr,
      settled_at: input.settledAt || todayLocalISO(),
      notes: input.notes || null,
      payment_reference: input.paymentReference || null,
      transaction_id: input.transactionId || null,
      payout_id: input.payoutId || null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to record invoice settlement: ${error?.message}`);
  }

  return data as InvoiceSettlement;
}

/**
 * Converts a confirmed receivable invoice into an expected payout in the payouts table.
 */
export async function convertReceivableToPayout(invoice: Invoice): Promise<string> {
  if (invoice.direction !== "receivable") {
    throw new Error("Only receivable invoices can be converted to expected payouts.");
  }

  const outstandingPaise = toPaise(invoice.total_amount) - toPaise(invoice.paid_amount);
  if (outstandingPaise <= 0) {
    throw new Error("Invoice is already fully settled.");
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Authenticated user required.");

  const { data, error } = await supabase
    .from("payouts")
    .insert({
      user_id: userId,
      source: invoice.customer_name || "Invoice Receivable",
      expected_amount: (outstandingPaise / 100).toFixed(2),
      expected_date: invoice.due_date || invoice.invoice_date,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to link invoice to expected payout: ${error?.message}`);
  }

  return data.id;
}

/**
 * Converts a confirmed payable invoice into an upcoming commitment in the commitments table.
 */
export async function convertPayableToCommitment(invoice: Invoice): Promise<string> {
  if (invoice.direction !== "payable") {
    throw new Error("Only payable bills can be converted to commitments.");
  }

  const outstandingPaise = toPaise(invoice.total_amount) - toPaise(invoice.paid_amount);
  if (outstandingPaise <= 0) {
    throw new Error("Invoice is already fully settled.");
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Authenticated user required.");

  const { data, error } = await supabase
    .from("commitments")
    .insert({
      user_id: userId,
      kind: "bill",
      title: `${invoice.supplier_name || "Supplier"} Bill`,
      amount: (outstandingPaise / 100).toFixed(2),
      due_date: invoice.due_date || invoice.invoice_date,
      status: "upcoming",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to link invoice to commitment: ${error?.message}`);
  }

  return data.id;
}
