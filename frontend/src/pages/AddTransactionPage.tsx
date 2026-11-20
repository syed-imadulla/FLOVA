import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { useTransactions } from "../data/useTransactions";
import { parseRequiredRupees } from "../profile/parseRupees";
import { SUGGESTED_CATEGORIES, type ExpenseType, type TransactionType } from "../types/contracts";
import { AppShell } from "../components/layout/AppShell";

export function AddTransactionPage() {
  const { add } = useTransactions();
  const navigate = useNavigate();

  const [type, setType] = useState<TransactionType>("expense");
  const [amountText, setAmountText] = useState("");
  const [category, setCategory] = useState("fuel");
  const [date, setDate] = useState(todayLocalISO());
  const [description, setDescription] = useState("");
  const [isNotMine, setIsNotMine] = useState(false);
  const [expenseType, setExpenseType] = useState<ExpenseType | "">("work");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState(() => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : ""));

  function handleTypeChange(newType: TransactionType) {
    setType(newType);
    if (isNotMine) {
      setCategory(newType === "income" ? "cod_collection" : "cod_handover");
    } else {
      setCategory(newType === "income" ? "earnings" : "fuel");
      if (newType === "expense" && !expenseType) {
        setExpenseType("work");
      }
    }
  }

  function handleNotMineChange(checked: boolean) {
    setIsNotMine(checked);
    if (checked) {
      setCategory(type === "income" ? "cod_collection" : "cod_handover");
      setExpenseType("");
    } else {
      setCategory(type === "income" ? "earnings" : "fuel");
      if (type === "expense") {
        setExpenseType("work");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);

    const amountRes = parseRequiredRupees(amountText);
    if (!amountRes.ok) {
      setError(amountRes.message);
      return;
    }

    if (type === "expense" && !isNotMine && !expenseType) {
      setError("Choose whether this expense is living or work.");
      return;
    }

    setSaving(true);
    try {
      await add({
        id: submissionId || undefined,
        type,
        amount: amountRes.paise,
        category,
        date,
        description: description.trim() || undefined,
        ownership: isNotMine ? "not_mine" : "mine",
        expenseType: type === "expense" && !isNotMine && expenseType ? expenseType : undefined,
      });
      setSavedMessage("Transaction recorded cleanly!");
      setAmountText("");
      setDescription("");
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        setSubmissionId(crypto.randomUUID());
      }
      navigate("/history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  }

  const categoryPresets = type === "income" ? SUGGESTED_CATEGORIES.income : SUGGESTED_CATEGORIES.expense;

  return (
    <AppShell activeNav="add">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
              Transaction Capture
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16181D]">
              Record Money
            </h1>
          </div>

          {/* Quick Voice / Check-In Mode Switchers */}
          <div className="flex items-center gap-2">
            <Link
              to="/voice"
              className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>🎙</span>
              <span>Voice Entry</span>
            </Link>
            <Link
              to="/checkin"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F6F3EC] border border-[#D5D0C5] text-xs font-bold text-[#16181D]"
            >
              Check-In Cash
            </Link>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 font-medium leading-relaxed">
            {error}
          </div>
        )}

        {savedMessage && (
          <div role="status" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold">
            {savedMessage}
          </div>
        )}

        {/* Card Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E2DC] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Income vs Expense Pill Switcher */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-2">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-[#F6F3EC] border border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => handleTypeChange("expense")}
                  className={`py-3 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    type === "expense"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-[#5A554A] hover:text-[#16181D]"
                  }`}
                >
                  Expense (Money Out)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("income")}
                  className={`py-3 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    type === "income"
                      ? "bg-[#0F5C4C] text-white shadow-xs"
                      : "text-[#5A554A] hover:text-[#16181D]"
                  }`}
                >
                  Income (Money In)
                </button>
              </div>
            </div>

            {/* Amount Field with Quick Preset Buttons */}
            <div>
              <label htmlFor="tx-amount" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-2">
                Amount (₹ Rupees)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#7A7468]">
                  ₹
                </span>
                <input
                  id="tx-amount"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  required
                  placeholder="0.00"
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  disabled={saving}
                  className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-xl font-bold font-mono tabular-nums text-[#16181D] focus:outline-none focus:border-[#0F5C4C] focus:ring-2 focus:ring-[#0F5C4C]/20"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span className="text-[11px] font-mono text-[#7A7468]">Presets:</span>
                {(type === "expense" ? [50, 150, 300, 500] : [500, 800, 1200, 1800]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountText(String(preset))}
                    className="px-2.5 py-1 rounded-lg bg-[#F6F3EC] hover:bg-[#EBE7DF] text-xs font-mono font-bold text-[#16181D] border border-[#E5E2DC]"
                  >
                    +₹{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* COD Platform Money Ringfence Checkbox */}
            <div className="p-4 rounded-2xl bg-[#FFF8EB] border border-[#FDE68A]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNotMine}
                  onChange={(e) => handleNotMineChange(e.target.checked)}
                  disabled={saving}
                  className="mt-0.5 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-[#92400E] block">
                    This money belongs to someone else (COD / Platform Cash)
                  </span>
                  <span className="text-[11px] text-[#B45309] leading-relaxed block mt-0.5">
                    Will be ringfenced and strictly excluded from your available runway so you don&apos;t spend company cash.
                  </span>
                </div>
              </label>
            </div>

            {/* Expense Type (Living vs Work) — only when mine and expense */}
            {type === "expense" && !isNotMine && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-2">
                  Expense Purpose (Required)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    expenseType === "work"
                      ? "bg-emerald-50/80 border-[#0F5C4C] text-[#0F5C4C] font-bold"
                      : "bg-[#FCFBF8] border-[#D5D0C5] text-[#5A554A]"
                  }`}>
                    <input
                      type="radio"
                      name="expenseType"
                      value="work"
                      checked={expenseType === "work"}
                      onChange={() => setExpenseType("work")}
                      className="sr-only"
                    />
                    <span>🛵</span>
                    <div>
                      <div className="text-xs">Work Expense</div>
                      <div className="text-[10px] text-[#7A7468]">Petrol, bike repair, phone</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    expenseType === "living"
                      ? "bg-emerald-50/80 border-[#0F5C4C] text-[#0F5C4C] font-bold"
                      : "bg-[#FCFBF8] border-[#D5D0C5] text-[#5A554A]"
                  }`}>
                    <input
                      type="radio"
                      name="expenseType"
                      value="living"
                      checked={expenseType === "living"}
                      onChange={() => setExpenseType("living")}
                      className="sr-only"
                    />
                    <span>🍛</span>
                    <div>
                      <div className="text-xs">Living Expense</div>
                      <div className="text-[10px] text-[#7A7468]">Chai, food, personal, home</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Category Presets */}
            <div>
              <label htmlFor="tx-category" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-2">
                Category
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] capitalize focus:outline-none focus:border-[#0F5C4C]"
              >
                {categoryPresets.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Optional Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tx-date" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Date
                </label>
                <input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                />
              </div>

              <div>
                <label htmlFor="tx-desc" className="block text-xs font-bold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  Note / Description (Optional)
                </label>
                <input
                  id="tx-desc"
                  type="text"
                  placeholder="e.g. HP petrol pump"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={saving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-sm text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-sm font-bold tracking-wide shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving Transaction..." : "Save Transaction"}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
