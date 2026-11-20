import React, { useState } from "react";
import { Link } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { useCommitments } from "../data/useCommitments";
import { formatINR, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import { SUGGESTED_CATEGORIES, type CommitmentKind } from "../types/contracts";

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
      setError("Please provide a title (e.g. Rent, EMI)");
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
      setSavedMessage("Commitment added successfully!");
      setTitle("");
      setAmountText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add commitment");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(id: string) {
    setError(null);
    try {
      await setStatus(id, "paid");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark paid");
    }
  }

  async function handleCancel(id: string) {
    if (!window.confirm("Cancel this commitment?")) return;
    setError(null);
    try {
      await setStatus(id, "cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel commitment");
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "680px", margin: "0 auto" }}>
      <p><Link to="/">← Back to Home</Link></p>
      <h1>Commitments (Bills & Debts)</h1>
      <p style={{ color: "#555" }}>
        Fixed obligations that must be paid on or by a specific date.
      </p>

      {(error || loadError) && (
        <div role="alert" style={{ color: "red", marginBottom: "1rem" }}>
          {error || loadError}
        </div>
      )}

      {savedMessage && (
        <div style={{ color: "green", marginBottom: "1rem" }}>
          {savedMessage}
        </div>
      )}

      {/* Add Commitment Form */}
      <form onSubmit={handleAddCommitment} style={{ border: "1px solid #ccc", padding: "1.25rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Add Bill or Debt</h2>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="comm-title" style={{ display: "block", marginBottom: "0.25rem" }}>
            Title
          </label>
          <input
            id="comm-title"
            type="text"
            placeholder="e.g. Rent, Vehicle EMI"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="comm-amount" style={{ display: "block", marginBottom: "0.25rem" }}>
            Amount (₹)
          </label>
          <input
            id="comm-amount"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 4500"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="comm-due-date" style={{ display: "block", marginBottom: "0.25rem" }}>
            Due Date
          </label>
          <input
            id="comm-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="comm-kind" style={{ display: "block", marginBottom: "0.25rem" }}>
            Kind
          </label>
          <select
            id="comm-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as CommitmentKind)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px" }}
          >
            <option value="bill">Bill (Rent, utility, recharge)</option>
            <option value="debt">Debt (EMI, personal loan, advance repayment)</option>
          </select>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="comm-category" style={{ display: "block", marginBottom: "0.25rem" }}>
            Category
          </label>
          <select
            id="comm-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px" }}
          >
            {SUGGESTED_CATEGORIES.commitment.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Adding..." : "Add Commitment"}
        </button>
      </form>

      {/* Commitments List */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{showAll ? "All Commitments" : "Upcoming Commitments"}</h2>
        <label style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />{" "}
          Show paid & cancelled
        </label>
      </div>

      {loading && items.length === 0 ? (
        <p>Loading commitments...</p>
      ) : items.length === 0 ? (
        <p>No commitments found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((c) => {
            const amountPaise = toPaise(c.amount);
            return (
              <div key={c.id} style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={{ margin: "0 0 0.25rem 0" }}>{c.title}</h3>
                  <span style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#eee", borderRadius: "3px" }}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>{formatINR(amountPaise)}</strong> | Due: {c.due_date} | Kind: {c.kind} ({c.category})
                </p>

                {c.status === "upcoming" && (
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleMarkPaid(c.id)}
                      style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", minHeight: "40px", cursor: "pointer" }}
                    >
                      Mark paid
                    </button>
                    <button
                      onClick={() => handleCancel(c.id)}
                      style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", minHeight: "40px", cursor: "pointer", color: "#666" }}
                    >
                      Cancel
                    </button>
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
