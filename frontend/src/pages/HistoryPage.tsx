import { useState } from "react";
import { Link } from "react-router-dom";
import { useTransactions } from "../data/useTransactions";
import { formatINR, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import type { ExpenseType, Transaction } from "../types/contracts";
import { AppShell } from "../components/layout/AppShell";

export function HistoryPage() {
  const { items, loading, error: loadError, update, remove } = useTransactions();

  const [filter, setFilter] = useState<"all" | "income" | "expense" | "cod">("all");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmountText, setEditAmountText] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editExpenseType, setEditExpenseType] = useState<ExpenseType | "">("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(t: Transaction) {
    setError(null);
    setEditingId(t.id);
    setEditAmountText(String(toPaise(t.amount) / 100));
    setEditCategory(t.category);
    setEditDate(t.transaction_date);
    setEditDescription(t.description || "");
    setEditExpenseType(t.expense_type || "");
  }

  async function handleSaveEdit(t: Transaction) {
    setError(null);
    const amountRes = parseRequiredRupees(editAmountText);
    if (!amountRes.ok) {
      setError(amountRes.message);
      return;
    }

    if (t.type === "expense" && t.ownership === "mine" && !editExpenseType) {
      setError("Choose whether this expense is living or work.");
      return;
    }

    setSaving(true);
    try {
      await update(t.id, {
        amount: amountRes.paise,
        category: editCategory,
        date: editDate,
        description: editDescription.trim() || undefined,
        expenseType: t.type === "expense" && t.ownership === "mine" && editExpenseType ? editExpenseType : undefined,
      });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update transaction");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to remove this transaction?")) return;
    try {
      await remove(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete transaction");
    }
  }

  // Filter items
  const filteredItems = items.filter((t) => {
    if (filter === "income" && t.type !== "income") return false;
    if (filter === "expense" && t.type !== "expense") return false;
    if (filter === "cod" && t.ownership !== "not_mine") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const cat = t.category.toLowerCase();
      const desc = (t.description || "").toLowerCase();
      return cat.includes(q) || desc.includes(q);
    }
    return true;
  });

  return (
    <AppShell activeNav="transactions">
      <div className="space-y-6">
        {/* Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7A7468]">
              Verified Ledger
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#16181D]">
              Transactions History
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/add"
              className="px-4 py-2 rounded-xl bg-[#0F5C4C] hover:bg-[#0c4a3d] text-white text-xs font-bold tracking-wide shadow-xs"
            >
              + Add Transaction
            </Link>
          </div>
        </div>

        {(error || loadError) && (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 leading-relaxed font-medium">
            {error || loadError}
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E5E2DC] shadow-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filter === "all" ? "bg-[#0F5C4C] text-white" : "bg-[#F6F3EC] text-[#5A554A] hover:text-[#16181D]"
              }`}
            >
              All Entries ({items.length})
            </button>
            <button
              onClick={() => setFilter("income")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filter === "income" ? "bg-emerald-800 text-white" : "bg-[#F6F3EC] text-[#5A554A] hover:text-[#16181D]"
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setFilter("expense")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filter === "expense" ? "bg-red-700 text-white" : "bg-[#F6F3EC] text-[#5A554A] hover:text-[#16181D]"
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setFilter("cod")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filter === "cod" ? "bg-amber-700 text-white" : "bg-[#F6F3EC] text-[#5A554A] hover:text-[#16181D]"
              }`}
            >
              COD / Not Mine
            </button>
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search category or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-1.5 rounded-xl border border-[#D5D0C5] bg-[#FCFBF8] text-xs text-[#16181D] focus:outline-none focus:border-[#0F5C4C]"
            />
          </div>
        </div>

        {/* Ledger List */}
        <div className="bg-white rounded-3xl border border-[#E5E2DC] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#7A7468] animate-pulse">
              Loading confirmed entries...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#7A7468]">
              No transactions found matching this view.{" "}
              <Link to="/add" className="text-[#0F5C4C] font-bold underline">
                Record your first transaction
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E2DC]">
              {filteredItems.map((t) => {
                const isEditing = editingId === t.id;
                const paise = toPaise(t.amount);
                const isIncome = t.type === "income";
                const isCOD = t.ownership === "not_mine";

                if (isEditing) {
                  return (
                    <div key={t.id} className="p-5 bg-[#FAF7F2] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold uppercase text-[#0F5C4C]">
                          Edit Transaction
                        </span>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-[#7A7468] hover:text-[#16181D]"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#7A7468] mb-1">Amount (₹)</label>
                          <input
                            type="number"
                            step="any"
                            value={editAmountText}
                            onChange={(e) => setEditAmountText(e.target.value)}
                            disabled={saving}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#D5D0C5] text-xs font-mono font-bold bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#7A7468] mb-1">Category</label>
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            disabled={saving}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#D5D0C5] text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#7A7468] mb-1">Date</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            disabled={saving}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#D5D0C5] text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#7A7468] mb-1">Description</label>
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            disabled={saving}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#D5D0C5] text-xs bg-white"
                          />
                        </div>
                      </div>

                      {t.type === "expense" && t.ownership === "mine" && (
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-bold text-[#7A7468]">Expense Type:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="editExpType"
                              value="work"
                              checked={editExpenseType === "work"}
                              onChange={() => setEditExpenseType("work")}
                            />
                            <span>Work</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="editExpType"
                              value="living"
                              checked={editExpenseType === "living"}
                              onChange={() => setEditExpenseType("living")}
                            />
                            <span>Living</span>
                          </label>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3.5 py-1.5 rounded-lg bg-white border border-[#D5D0C5] text-xs font-bold text-[#5A554A]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSaveEdit(t)}
                          className="px-4 py-1.5 rounded-lg bg-[#0F5C4C] text-white text-xs font-bold"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={t.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#FAF7F2] transition-colors"
                  >
                    {/* Left Icon & Meta */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isCOD
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : isIncome
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            : "bg-red-50 text-red-900 border border-red-200"
                        }`}
                      >
                        {isCOD ? "COD" : isIncome ? "↓" : "↑"}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#16181D] capitalize truncate">
                            {t.category.replace("_", " ")}
                          </span>

                          {/* Status and Ownership Pills */}
                          {isCOD && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                              Platform Cash
                            </span>
                          )}
                          {!isCOD && t.type === "expense" && t.expense_type && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                              {t.expense_type}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[#7A7468] truncate mt-0.5">
                          {t.transaction_date}
                          {t.description ? ` • ${t.description}` : ""}
                          {t.source ? ` • source: ${t.source}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Right Amount & Actions */}
                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div className="font-mono tabular-nums">
                        <div
                          className={`text-base font-black ${
                            isCOD
                              ? "text-[#B45309]"
                              : isIncome
                              ? "text-[#0F5C4C]"
                              : "text-red-700"
                          }`}
                        >
                          {isIncome ? `+${formatINR(paise)}` : `−${formatINR(paise)}`}
                        </div>
                        <div className="text-[10px] text-[#7A7468]">Confirmed</div>
                      </div>

                      {/* Action buttons */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <button
                          onClick={() => startEdit(t)}
                          className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-[#7A7468] text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="px-2.5 py-1 rounded-lg hover:bg-red-50 text-red-700 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
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
