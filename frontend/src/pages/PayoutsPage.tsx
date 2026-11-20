import React, { useState } from "react";
import { Link } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { usePayouts } from "../data/usePayouts";
import { formatINR, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import type { Payout, PayoutKind, PayoutStatus } from "../types/contracts";
import { AppShell } from "../components/layout/AppShell";

export function PayoutsPage() {
  const { items, loading, error: loadError, add, receive, setStatus } = usePayouts();

  // New payout form state
  const [expectedAmountText, setExpectedAmountText] = useState("");
  const [kind, setKind] = useState<PayoutKind>("platform_payout");
  const [source, setSource] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [status, setStatusValue] = useState<Extract<PayoutStatus, "scheduled" | "estimated" | "unearned">>("scheduled");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Receiving inline modal / state
  const [receivingPayoutId, setReceivingPayoutId] = useState<string | null>(null);
  const [receiveAmountText, setReceiveAmountText] = useState("");
  const [receiveIdempotencyId, setReceiveIdempotencyId] = useState<string | null>(null);

  async function handleAddPayout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);

    const amountRes = parseRequiredRupees(expectedAmountText);
    if (!amountRes.ok) {
      setError(amountRes.message);
      return;
    }

    setSaving(true);
    try {
      await add({
        expected: amountRes.paise,
        kind,
        source: source.trim() || undefined,
        expectedDate: expectedDate || undefined,
        status,
      });
      setSavedMessage("Expected payout recorded cleanly!");
      setExpectedAmountText("");
      setSource("");
      setExpectedDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add payout");
    } finally {
      setSaving(false);
    }
  }

  function startReceive(p: Payout) {
    setError(null);
    setReceivingPayoutId(p.id);
    const remainingPaise = toPaise(p.expected_amount) - toPaise(p.received_amount);
    setReceiveAmountText(String(Math.max(0, remainingPaise) / 100));
    setReceiveIdempotencyId(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : null);
  }

  async function handleConfirmReceive(payoutId: string) {
    setError(null);
    const amountRes = parseRequiredRupees(receiveAmountText);
    if (!amountRes.ok) {
      setError(amountRes.message);
      return;
    }

    setSaving(true);
    try {
      await receive(payoutId, amountRes.paise, todayLocalISO(), receiveIdempotencyId || undefined);
      setReceivingPayoutId(null);
      setReceiveAmountText("");
      setReceiveIdempotencyId(null);
      setSavedMessage("Payout receipt confirmed and added to your available cash!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record received payout");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetStatus(id: string, s: Extract<PayoutStatus, "scheduled" | "estimated" | "unearned" | "cancelled">) {
    try {
      await setStatus(id, s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <AppShell activeNav="plan">
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
              Expected Inflow
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16181D]">
              Platform Payouts
            </h1>
          </div>

          <Link
            to="/commitments"
            className="text-xs font-bold text-[#0F5C4C] hover:underline"
          >
            ← View Bills &amp; Commitments
          </Link>
        </div>

        {(error || loadError) && (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium leading-relaxed">
            {error || loadError}
          </div>
        )}

        {savedMessage && (
          <div role="status" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold">
            {savedMessage}
          </div>
        )}

        {/* Info notice about expected payouts */}
        <div className="p-5 rounded-3xl bg-[#FFF8EB] border border-[#FDE68A] text-xs text-[#92400E]">
          <div className="font-bold mb-1">💡 FLOVA Strict Cash Rule</div>
          <p className="leading-relaxed">
            Expected payouts are never added to your available cash balance until they are settled into your bank account. Once received, click &quot;Receive Cash&quot; below to settle the payout and update your confirmed runway.
          </p>
        </div>

        {/* Add Payout Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E2DC] shadow-sm">
          <h2 className="text-lg font-bold text-[#16181D] mb-4">Log Expected Platform Payout</h2>
          <form onSubmit={handleAddPayout} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="po-amount" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Expected Amount (₹)
                </label>
                <input
                  id="po-amount"
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 5200"
                  value={expectedAmountText}
                  onChange={(e) => setExpectedAmountText(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm font-mono tabular-nums text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                />
              </div>

              <div>
                <label htmlFor="po-source" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Platform / Client Source
                </label>
                <input
                  id="po-source"
                  type="text"
                  placeholder="e.g. Swiggy, Zomato, Zepto"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="po-date" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Expected Date (Optional)
                </label>
                <input
                  id="po-date"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                />
              </div>

              <div>
                <label htmlFor="po-kind" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Payout Kind
                </label>
                <select
                  id="po-kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as PayoutKind)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] capitalize focus:outline-none focus:border-[#0F5C4C]"
                >
                  <option value="platform_payout">Platform Weekly Payout</option>
                  <option value="incentive">Delivery Incentive / Surge</option>
                  <option value="advance">Earned Salary Advance</option>
                  <option value="client_payment">Client Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="po-status" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Confidence Status
                </label>
                <select
                  id="po-status"
                  value={status}
                  onChange={(e) => setStatusValue(e.target.value as any)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                >
                  <option value="scheduled">Scheduled (Platform Date Confirmed)</option>
                  <option value="estimated">Estimated (Projected Shifts)</option>
                  <option value="unearned">Unearned (Requires Orders)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-xs font-bold tracking-wide shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving Payout..." : "+ Log Expected Payout"}
            </button>
          </form>
        </div>

        {/* Existing Payouts List */}
        <div className="bg-white rounded-3xl border border-[#E5E2DC] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E5E2DC]">
            <h2 className="text-base font-bold text-[#16181D]">Logged Payouts</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#7A7468] animate-pulse">
              Loading payouts...
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#7A7468]">
              No expected payouts on record.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E2DC]">
              {items.map((p) => {
                const expPaise = toPaise(p.expected_amount);
                const recPaise = toPaise(p.received_amount);
                const isSettled = p.status === "settled";
                const isPartial = p.status === "partial";
                const isCancelled = p.status === "cancelled";

                return (
                  <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF7F2] transition-colors">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#16181D]">
                          {p.source || "Platform Payout"}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                          {p.kind.replace("_", " ")}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isSettled
                              ? "bg-emerald-100 text-emerald-800"
                              : isPartial
                              ? "bg-amber-100 text-amber-900"
                              : isCancelled
                              ? "bg-slate-200 text-slate-700"
                              : "bg-blue-100 text-blue-900"
                          }`}
                        >
                          {p.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#7A7468] mt-0.5">
                        Expected: {p.expected_date || "Date unknown"} • Received so far: {formatINR(recPaise)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right font-mono tabular-nums">
                        <div className="text-base font-black text-[#0F5C4C]">
                          {formatINR(expPaise)}
                        </div>
                        <div className="text-[10px] text-[#7A7468]">Expected</div>
                      </div>

                      {!isSettled && !isCancelled && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startReceive(p)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Receive Cash
                          </button>
                          <button
                            onClick={() => handleSetStatus(p.id, "cancelled")}
                            className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Receive Inline Dialog */}
        {receivingPayoutId && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#E5E2DC] shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-[#16181D]">
                Confirm Money Received in Bank / Cash
              </h3>
              <p className="text-xs text-[#7A7468]">
                Enter the exact amount settled into your account. The database trigger will calculate any partial balance.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase text-[#5A554A] mb-1">
                  Received Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={receiveAmountText}
                  onChange={(e) => setReceiveAmountText(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] text-base font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReceivingPayoutId(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#D5D0C5] text-xs font-bold text-[#5A554A]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleConfirmReceive(receivingPayoutId)}
                  className="px-4 py-2 rounded-xl bg-[#0F5C4C] text-white text-xs font-bold"
                >
                  {saving ? "Confirming..." : "Confirm & Settle"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
