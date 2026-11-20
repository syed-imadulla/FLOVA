import { useState } from "react";
import { Link } from "react-router-dom";
import { useTransactions } from "../data/useTransactions";
import { formatINR, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import type { ExpenseType, Transaction } from "../types/contracts";

export function HistoryPage() {
  const { items, loading, error: loadError, update, remove } = useTransactions();

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

  async function handleDelete(t: Transaction) {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    setError(null);
    try {
      await remove(t.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete transaction");
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "680px", margin: "0 auto" }}>
      <p><Link to="/">← Back to Home</Link> | <Link to="/add">+ Add Transaction</Link></p>
      <h1>Transaction History</h1>

      {(error || loadError) && (
        <div role="alert" style={{ color: "red", marginBottom: "1rem" }}>
          {error || loadError}
        </div>
      )}

      {loading && items.length === 0 ? (
        <p>Loading transactions...</p>
      ) : items.length === 0 ? (
        <p>No transactions found. <Link to="/add">Add one now</Link>.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((t) => {
            const amountPaise = toPaise(t.amount);
            const isEditing = editingId === t.id;

            return (
              <div key={t.id} style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "4px" }}>
                {!isEditing ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: t.type === "income" ? "green" : "#b00" }}>
                        {t.type === "income" ? "+" : "−"} {formatINR(amountPaise)}
                      </span>
                      <span style={{ fontSize: "0.9rem", color: "#666" }}>{t.transaction_date}</span>
                    </div>

                    <p style={{ margin: "0.4rem 0" }}>
                      <strong>{t.category}</strong>
                      {t.description && ` — ${t.description}`}
                    </p>

                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                      {t.expense_type && (
                        <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#eef", borderRadius: "3px" }}>
                          {t.expense_type === "living" ? "Living" : "Work"}
                        </span>
                      )}
                      {t.ownership === "not_mine" && (
                        <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#fee", color: "#c00", borderRadius: "3px" }}>
                          not mine (COD)
                        </span>
                      )}
                      {t.payout_id && (
                        <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "#efe", color: "#060", borderRadius: "3px" }}>
                          payout receipt
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => startEdit(t)}
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.9rem", cursor: "pointer" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.9rem", cursor: "pointer", color: "red" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#fcfcfc", padding: "0.5rem" }}>
                    <h4>Edit Transaction</h4>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <label style={{ display: "block", fontSize: "0.9rem" }}>Amount (₹):</label>
                      <input
                        type="text"
                        value={editAmountText}
                        onChange={(e) => setEditAmountText(e.target.value)}
                        disabled={saving}
                        style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
                      />
                    </div>

                    <div style={{ marginBottom: "0.5rem" }}>
                      <label style={{ display: "block", fontSize: "0.9rem" }}>Category:</label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        disabled={saving}
                        style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
                      />
                    </div>

                    <div style={{ marginBottom: "0.5rem" }}>
                      <label style={{ display: "block", fontSize: "0.9rem" }}>Date:</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        disabled={saving}
                        style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
                      />
                    </div>

                    {t.type === "expense" && t.ownership === "mine" && (
                      <div style={{ marginBottom: "0.5rem" }}>
                        <label style={{ display: "block", fontSize: "0.9rem" }}>Classification:</label>
                        <select
                          value={editExpenseType}
                          onChange={(e) => setEditExpenseType(e.target.value as ExpenseType)}
                          disabled={saving}
                          style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
                        >
                          <option value="living">Living</option>
                          <option value="work">Work</option>
                        </select>
                      </div>
                    )}

                    <div style={{ marginBottom: "0.75rem" }}>
                      <label style={{ display: "block", fontSize: "0.9rem" }}>Description:</label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        disabled={saving}
                        style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleSaveEdit(t)}
                        disabled={saving}
                        style={{ padding: "0.5rem 1rem", cursor: saving ? "not-allowed" : "pointer" }}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={saving}
                        style={{ padding: "0.5rem 1rem" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
