import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { useTransactions } from "../data/useTransactions";
import { parseRequiredRupees } from "../profile/parseRupees";
import { SUGGESTED_CATEGORIES, type ExpenseType, type TransactionType } from "../types/contracts";

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

  // When type or isNotMine changes, adjust default category
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
        type,
        amount: amountRes.paise,
        category,
        date,
        description: description.trim() || undefined,
        ownership: isNotMine ? "not_mine" : "mine",
        expenseType: type === "expense" && !isNotMine && expenseType ? expenseType : undefined,
      });
      setSavedMessage("Transaction saved successfully!");
      setAmountText("");
      setDescription("");
      navigate("/history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  }

  const categoryPresets = type === "income" ? SUGGESTED_CATEGORIES.income : SUGGESTED_CATEGORIES.expense;

  return (
    <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
      <p><Link to="/">← Back to Home</Link> | <Link to="/history">View History</Link></p>
      <h1>Add Transaction</h1>

      {error && (
        <div role="alert" style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {savedMessage && (
        <div style={{ color: "green", marginBottom: "1rem" }}>
          {savedMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Type toggle */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: "1rem", fontWeight: "bold" }}>Type:</label>
          <label style={{ marginRight: "1rem", cursor: "pointer" }}>
            <input
              type="radio"
              name="type"
              value="income"
              checked={type === "income"}
              onChange={() => handleTypeChange("income")}
              disabled={saving}
            />{" "}
            Income
          </label>
          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              name="type"
              value="expense"
              checked={type === "expense"}
              onChange={() => handleTypeChange("expense")}
              disabled={saving}
            />{" "}
            Expense
          </label>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="tx-amount" style={{ display: "block", marginBottom: "0.25rem" }}>
            Amount (₹)
          </label>
          <input
            id="tx-amount"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 150"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        {/* Not mine checkbox */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isNotMine}
              onChange={(e) => handleNotMineChange(e.target.checked)}
              disabled={saving}
            />
            This money belongs to the platform or someone else (e.g. COD)
          </label>
        </div>

        {/* Living vs Work classification (Only if expense and not COD) */}
        {type === "expense" && !isNotMine && (
          <fieldset style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "0.75rem" }}>
            <legend style={{ fontWeight: "bold" }}>Expense Classification (Required)</legend>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.25rem" }}>
              <label style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  name="expense-type"
                  value="living"
                  checked={expenseType === "living"}
                  onChange={() => setExpenseType("living")}
                  disabled={saving}
                />{" "}
                Living (Food, personal)
              </label>
              <label style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  name="expense-type"
                  value="work"
                  checked={expenseType === "work"}
                  onChange={() => setExpenseType("work")}
                  disabled={saving}
                />{" "}
                Work (Fuel, vehicle, phone)
              </label>
            </div>
          </fieldset>
        )}

        {/* Category presets */}
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="tx-category" style={{ display: "block", marginBottom: "0.25rem" }}>
            Category
          </label>
          <select
            id="tx-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px" }}
          >
            {categoryPresets.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="tx-date" style={{ display: "block", marginBottom: "0.25rem" }}>
            Date
          </label>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="tx-desc" style={{ display: "block", marginBottom: "0.25rem" }}>
            Description (optional)
          </label>
          <input
            id="tx-desc"
            type="text"
            placeholder="Notes or details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving..." : "Save Transaction"}
        </button>
      </form>
    </div>
  );
}
