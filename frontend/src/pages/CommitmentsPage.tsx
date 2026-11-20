import React, { useState } from "react";
import { Link } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { useCommitments } from "../data/useCommitments";
import { formatINR, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import { SUGGESTED_CATEGORIES, type CommitmentKind } from "../types/contracts";
import { AppShell } from "../components/layout/AppShell";

export function CommitmentsPage() {
  const [showAll, setShowAll] = useState(false);
  const { items, loading, error: loadError, add, setStatus } = useCommitments(showAll ? "all" : "upcoming");

  const [title, setTitle] = useState("");
  const [amountText, setAmountText] = useState("");
  const [dueDate, setDueDate] = useState(todayLocalISO());
  const [kind, setKind] = useState<CommitmentKind>("bill");
  const [category, setCategory] = useState("rent");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleAddCommitment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);

    if (!title.trim()) {
      setError("Please provide a title (e.g. Rent, Bike EMI)");
      return;
    }

    const amountRes = parseRequiredRupees(amountText);
    if (!amountRes.ok) {
      setError(amountRes.message);
      return;
    }

    if (!dueDate) {
      setError("Please select a due date");
      return;
    }

    setSaving(true);
    try {
      await add({
        title: title.trim(),
        amount: amountRes.paise,
        dueDate,
        kind,
        category,
      });
      setSavedMessage("Upcoming commitment added cleanly!");
      setTitle("");
      setAmountText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add commitment");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetStatus(id: string, status: "paid" | "cancelled" | "upcoming") {
    try {
      await setStatus(id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update commitment status");
    }
  }

  // Calculate total upcoming commitments
  const totalUpcomingPaise = items
    .filter((c) => c.status === "upcoming")
    .reduce((sum, c) => sum + toPaise(c.amount), 0);

  return (
    <AppShell activeNav="plan">
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header with Tab switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
              Plan &amp; Prepare
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16181D]">
              Upcoming Commitments &amp; Bills
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/payouts"
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#F6F3EC] border border-[#D5D0C5] text-xs font-bold text-[#16181D] shadow-xs"
            >
              Manage Expected Payouts →
            </Link>
          </div>
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

        {/* Total Upcoming Commitment Banner */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-[#7A7468] block mb-1">
              Total Upcoming Obligations
            </span>
            <div className="text-3xl font-black text-red-700 font-mono tabular-nums">
              −{formatINR(totalUpcomingPaise)}
            </div>
            <p className="text-xs text-[#7A7468] mt-1">
              Automatically deducted on due dates in your deterministic runway projection.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#5A554A]">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="w-4 h-4 text-[#0F5C4C] rounded border-[#D5D0C5]"
            />
            <span>Show Paid &amp; Cancelled Bills</span>
          </label>
        </div>

        {/* Add Commitment Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E2DC] shadow-sm">
          <h2 className="text-lg font-bold text-[#16181D] mb-4">Add Bill, EMI, or Debt</h2>
          <form onSubmit={handleAddCommitment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="comm-title" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Title
                </label>
                <input
                  id="comm-title"
                  type="text"
                  required
                  placeholder="e.g. Room Rent, Bike EMI, Electricity"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                />
              </div>

              <div>
                <label htmlFor="comm-amount" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Amount (₹)
                </label>
                <input
                  id="comm-amount"
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 4500"
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm font-mono tabular-nums text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="comm-date" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Due Date
                </label>
                <input
                  id="comm-date"
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                />
              </div>

              <div>
                <label htmlFor="comm-kind" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Obligation Kind
                </label>
                <select
                  id="comm-kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as CommitmentKind)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                >
                  <option value="bill">Recurring Bill (Rent, Phone)</option>
                  <option value="debt">Loan / EMI / Debt</option>
                </select>
              </div>

              <div>
                <label htmlFor="comm-cat" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Category
                </label>
                <select
                  id="comm-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] capitalize focus:outline-none focus:border-[#0F5C4C]"
                >
                  {SUGGESTED_CATEGORIES.commitment.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-xs font-bold tracking-wide shadow-sm transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving Commitment..." : "+ Add to Runway Plan"}
            </button>
          </form>
        </div>

        {/* Existing Commitments List */}
        <div className="bg-white rounded-3xl border border-[#E5E2DC] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E5E2DC]">
            <h2 className="text-base font-bold text-[#16181D]">Logged Commitments</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#7A7468] animate-pulse">
              Loading commitments...
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#7A7468]">
              No upcoming commitments recorded.
            </div>
          ) : (
            <div className="divide-y divide-[#E5E2DC]">
              {items.map((c) => {
                const paise = toPaise(c.amount);
                const isPaid = c.status === "paid";
                const isCancelled = c.status === "cancelled";

                return (
                  <div
                    key={c.id}
                    className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                      isPaid || isCancelled ? "opacity-60 bg-[#FAF7F2]" : "hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#16181D]">{c.title}</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {c.kind}
                        </span>
                        {c.status !== "upcoming" && (
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isPaid ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-800"
                            }`}
                          >
                            {c.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#7A7468] mt-0.5">
                        Due: {c.due_date} • Category: {c.category}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-base font-black text-red-700 font-mono tabular-nums text-right">
                        −{formatINR(paise)}
                      </div>

                      {c.status === "upcoming" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSetStatus(c.id, "paid")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleSetStatus(c.id, "cancelled")}
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
      </div>
    </AppShell>
  );
}
