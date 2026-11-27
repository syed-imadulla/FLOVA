// =====================================================================
// FLOVA Invoices & Bills Screen (Owner: M4 / Phase 15)
// Read and manage uploaded invoices, track receivables and payables,
// record partial settlements, and link confirmed invoices to the runway.
// =====================================================================

import { useEffect, useState } from "react";
import { formatINR, toPaise } from "../lib/money";
import { todayLocalISO } from "../data/dates";
import { parseRequiredRupees } from "../profile/parseRupees";
import {
  listInvoices,
  createInvoice,
  addInvoiceSettlement,
  convertReceivableToPayout,
  convertPayableToCommitment,
  type CreateInvoiceInput,
} from "../services/invoices";
import type { Invoice, InvoiceDirection } from "../types/contracts";
import { Button, Card, Field, Modal, MoneyInput, Notice, Screen, Segmented, TextInput, cx } from "../ui/kit";
import { IconArrowUp, IconCheckCircle, IconPlus, IconWallet } from "../ui/icons";

export function InvoicesScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "receivable" | "payable" | "overdue">("all");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // New Invoice Modal
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [direction, setDirection] = useState<InvoiceDirection>("receivable");
  const [partyName, setPartyName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Settlement Modal
  const [settleInvoice, setSettleInvoice] = useState<Invoice | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNotes, setSettleNotes] = useState("");
  const [settling, setSettling] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const data = await listInvoices();
      setInvoices(data);
    } catch (e: any) {
      setError(e.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // Compute metrics in integer paise
  let totalReceivablePaise = 0;
  let totalPayablePaise = 0;

  for (const inv of invoices) {
    if (inv.status !== "paid" && inv.status !== "cancelled") {
      const outstanding = Math.max(0, toPaise(inv.total_amount) - toPaise(inv.paid_amount));
      if (inv.direction === "receivable") {
        totalReceivablePaise += outstanding;
      } else {
        totalPayablePaise += outstanding;
      }
    }
  }

  const filtered = invoices.filter((inv) => {
    if (tab === "receivable") return inv.direction === "receivable";
    if (tab === "payable") return inv.direction === "payable";
    if (tab === "overdue") return inv.status === "overdue" || (inv.due_date && inv.due_date < todayLocalISO() && inv.status !== "paid");
    return true;
  });

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    const total = parseRequiredRupees(amountInput);
    if (!total.ok) {
      setError(total.message);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const input: CreateInvoiceInput = {
        direction,
        customerName: direction === "receivable" ? partyName : undefined,
        supplierName: direction === "payable" ? partyName : undefined,
        invoiceNumber: invoiceNumber || undefined,
        totalAmountPaise: total.paise,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      };

      await createInvoice(input);
      setFlash(`Invoice created: ${formatINR(total.paise)}`);
      setIsNewOpen(false);
      resetNewForm();
      await loadData();
    } catch (e: any) {
      setError(e.message || "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetNewForm() {
    setPartyName("");
    setInvoiceNumber("");
    setAmountInput("");
    setDueDate("");
    setNotes("");
  }

  async function handleRecordSettlement(e: React.FormEvent) {
    e.preventDefault();
    if (!settleInvoice) return;
    const amount = parseRequiredRupees(settleAmount);
    if (!amount.ok) {
      setError(amount.message);
      return;
    }
    const outstandingPaise = toPaise(settleInvoice.total_amount) - toPaise(settleInvoice.paid_amount);
    if (amount.paise > outstandingPaise) {
      setError(`Payment is more than the ${formatINR(outstandingPaise)} still outstanding.`);
      return;
    }

    setSettling(true);
    setError(null);
    try {
      await addInvoiceSettlement({
        invoiceId: settleInvoice.id,
        amountPaise: amount.paise,
        notes: settleNotes || undefined,
      });

      setFlash(`Recorded payment of ${formatINR(amount.paise)} for ${settleInvoice.customer_name || settleInvoice.supplier_name || "invoice"}.`);
      setSettleInvoice(null);
      setSettleAmount("");
      setSettleNotes("");
      await loadData();
    } catch (e: any) {
      setError(e.message || "Failed to record payment.");
    } finally {
      setSettling(false);
    }
  }

  async function handleLinkToRunway(inv: Invoice) {
    setError(null);
    try {
      if (inv.direction === "receivable") {
        await convertReceivableToPayout(inv);
        setFlash(`Linked to Expected Payouts: ${inv.customer_name || "Receivable"}`);
      } else {
        await convertPayableToCommitment(inv);
        setFlash(`Linked to Upcoming Bills: ${inv.supplier_name || "Payable"}`);
      }
    } catch (e: any) {
      setError(e.message || "Failed to link invoice to runway.");
    }
  }

  return (
    <Screen
      title="Invoices & Bills"
      subtitle="Track expected receivables and upcoming payable bills"
      back="/more"
      right={
        <button
          type="button"
          onClick={() => setIsNewOpen(true)}
          className="h-9 px-3 rounded-full bg-brand-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm hover:bg-brand-800"
        >
          <IconPlus size={14} /> New
        </button>
      }
    >
      {flash && (
        <Notice tone="success" title="Success">
          {flash}
        </Notice>
      )}

      {error && (
        <Notice tone="danger" title="Error">
          {error}
        </Notice>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-3.5 bg-emerald-50/60 border-emerald-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
            <IconArrowUp size={14} /> Expected Receivables
          </div>
          <div className="text-xl font-bold text-emerald-950">
            {formatINR(totalReceivablePaise)}
          </div>
          <p className="text-[11px] text-emerald-700 mt-0.5">Money clients owe you</p>
        </Card>

        <Card className="p-3.5 bg-amber-50/60 border-amber-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mb-1">
            <IconWallet size={14} /> Upcoming Payables
          </div>
          <div className="text-xl font-bold text-amber-950">
            {formatINR(totalPayablePaise)}
          </div>
          <p className="text-[11px] text-amber-700 mt-0.5">Supplier bills you owe</p>
        </Card>
      </div>

      <Segmented
        value={tab}
        onChange={(v) => setTab(v as any)}
        options={[
          { value: "all", label: "All" },
          { value: "receivable", label: "Receivables" },
          { value: "payable", label: "Payables" },
          { value: "overdue", label: "Overdue" },
        ]}
      />

      {loading ? (
        <div className="py-12 text-center text-sm text-neutral-500">Loading invoices...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center mt-4">
          <p className="text-sm font-semibold text-neutral-700">No invoices found</p>
          <p className="text-xs text-neutral-500 mt-1">
            {tab === "all"
              ? "You haven't added any invoices or bills yet."
              : `No invoices match the '${tab}' filter.`}
          </p>
          <Button variant="secondary" className="!h-9 !w-auto !px-4 text-xs mx-auto mt-4" onClick={() => setIsNewOpen(true)}>
            Add an invoice
          </Button>
        </Card>
      ) : (
        <div className="space-y-3 mt-4">
          {filtered.map((inv) => {
            const totalPaise = toPaise(inv.total_amount);
            const paidPaise = toPaise(inv.paid_amount);
            const outstandingPaise = Math.max(0, totalPaise - paidPaise);
            const isReceivable = inv.direction === "receivable";
            const party = isReceivable ? inv.customer_name || "Client" : inv.supplier_name || "Supplier";
            const percent = totalPaise > 0 ? Math.min(100, Math.round((paidPaise / totalPaise) * 100)) : 0;

            return (
              <Card key={inv.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 text-sm">{party}</span>
                      <span className={cx(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        isReceivable ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {isReceivable ? "Receivable" : "Payable"}
                      </span>
                    </div>
                    {inv.invoice_number && (
                      <p className="text-xs text-neutral-500 mt-0.5">#{inv.invoice_number}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm text-neutral-900">{formatINR(totalPaise)}</div>
                    {inv.status === "paid" ? (
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 justify-end">
                        <IconCheckCircle size={12} /> Settled
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-500">
                        Outstanding: <span className="font-medium text-neutral-800">{formatINR(outstandingPaise)}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {totalPaise > 0 && inv.status !== "paid" && (
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                      <span>Paid: {formatINR(paidPaise)} ({percent}%)</span>
                      {inv.due_date && <span>Due: {inv.due_date}</span>}
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={isReceivable ? "bg-emerald-600 h-1.5" : "bg-amber-600 h-1.5"}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-neutral-100">
                  {inv.status !== "paid" && (
                    <Button
                      variant="secondary"
                      className="!h-9 !py-1 flex-1 text-xs"
                      onClick={() => {
                        setSettleInvoice(inv);
                        setSettleAmount((outstandingPaise / 100).toFixed(2));
                      }}
                    >
                      Record Payment
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="!h-9 !py-1 text-xs text-neutral-600"
                    onClick={() => handleLinkToRunway(inv)}
                  >
                    Link to Runway
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Invoice Modal */}
      <Modal open={isNewOpen} onClose={() => setIsNewOpen(false)} title="New Invoice / Bill">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <Segmented
            value={direction}
            onChange={(v) => setDirection(v as any)}
            options={[
              { value: "receivable", label: "Receivable (Client owes you)" },
              { value: "payable", label: "Payable (Supplier bill you owe)" },
            ]}
          />

          <Field label={direction === "receivable" ? "Client / Customer Name" : "Supplier / Vendor Name"}>
            {(id) => (
              <TextInput
                id={id}
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder={direction === "receivable" ? "e.g. Swiggy, Acme Studio" : "e.g. Shell Petrol, Landlord"}
                required
              />
            )}
          </Field>

          <Field label="Invoice / Bill Number (Optional)">
            {(id) => (
              <TextInput
                id={id}
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-001"
              />
            )}
          </Field>

          <Field label="Total Amount">
            {(id) => (
              <MoneyInput
                id={id}
                value={amountInput}
                onChange={setAmountInput}
              />
            )}
          </Field>

          <Field label="Due Date">
            {(id) => (
              <TextInput
                id={id}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            )}
          </Field>

          <Field label="Notes (Optional)">
            {(id) => (
              <TextInput
                id={id}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details or terms"
              />
            )}
          </Field>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setIsNewOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Invoice"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={!!settleInvoice} onClose={() => setSettleInvoice(null)} title="Record Payment / Settlement">
        {settleInvoice && (
          <form onSubmit={handleRecordSettlement} className="space-y-4">
            <p className="text-xs text-neutral-600">
              Recording payment for{" "}
              <span className="font-semibold text-neutral-900">
                {settleInvoice.customer_name || settleInvoice.supplier_name || "Invoice"}
              </span>
              . Total invoice is {formatINR(toPaise(settleInvoice.total_amount))}.
            </p>

            <Field label="Settlement Amount">
              {(id) => (
                <MoneyInput
                  id={id}
                  value={settleAmount}
                  onChange={setSettleAmount}
                />
              )}
            </Field>

            <Field label="Payment Reference / Notes">
              {(id) => (
                <TextInput
                  id={id}
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. NEFT ref, UPI UTR, partial advance"
                />
              )}
            </Field>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" type="button" onClick={() => setSettleInvoice(null)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" type="submit" disabled={settling}>
                {settling ? "Recording..." : "Confirm Payment"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </Screen>
  );
}
