import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLatestCheckin } from "../data/useLatestCheckin";
import { formatINR, toPaise } from "../lib/money";
import { parseOptionalRupees } from "../profile/parseRupees";

export function CheckinPage() {
  const { checkin, loading, error: loadError, add } = useLatestCheckin();

  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");
  const [cod, setCod] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);

    // Validate cash and bank
    const cashRes = parseOptionalRupees(cash || "0");
    if (!cashRes.ok || cashRes.paise === null || cashRes.paise < 0) {
      setError(cashRes.ok ? "Cash amount must be 0 or more" : `Cash: ${cashRes.message}`);
      return;
    }

    const bankRes = parseOptionalRupees(bank || "0");
    if (!bankRes.ok || bankRes.paise === null || bankRes.paise < 0) {
      setError(bankRes.ok ? "Bank amount must be 0 or more" : `Bank: ${bankRes.message}`);
      return;
    }

    const codRes = parseOptionalRupees(cod || "0");
    if (!codRes.ok || codRes.paise === null || codRes.paise < 0) {
      setError(codRes.ok ? "COD amount must be 0 or more" : `COD: ${codRes.message}`);
      return;
    }

    const totalCashBank = cashRes.paise + bankRes.paise;
    if (codRes.paise > totalCashBank) {
      setError("COD amount cannot exceed total cash and bank");
      return;
    }

    setSaving(true);
    try {
      await add({
        cash: cashRes.paise,
        bank: bankRes.paise,
        notMine: codRes.paise,
      });
      setSavedMessage("Balance check-in saved successfully!");
      setCash("");
      setBank("");
      setCod("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record check-in");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
      <p><Link to="/">← Back to Home</Link></p>
      <h1>Balance Check-In</h1>
      <p style={{ color: "#555" }}>
        Record the cash in your pocket and money in your bank right now.
      </p>

      {/* Latest checkin info */}
      <div style={{ padding: "1rem", backgroundColor: "#f9f9f9", border: "1px solid #ddd", marginBottom: "1.5rem" }}>
        <strong>Latest Check-In:</strong>
        {loading && !checkin ? (
          <div>Loading check-in...</div>
        ) : checkin ? (
          <div style={{ marginTop: "0.5rem" }}>
            <p style={{ margin: "0.25rem 0" }}>
              Total: {formatINR(toPaise(checkin.cash_amount) + toPaise(checkin.bank_amount))} (Cash: {formatINR(toPaise(checkin.cash_amount))}, Bank: {formatINR(toPaise(checkin.bank_amount))})
            </p>
            <p style={{ margin: "0.25rem 0" }}>
              COD / Not Mine: {formatINR(toPaise(checkin.not_mine_amount))}
            </p>
            <p style={{ margin: "0.25rem 0", fontSize: "0.85rem", color: "#666" }}>
              Checked at: {new Date(checkin.checked_at).toLocaleString()}
            </p>
          </div>
        ) : (
          <div>No balance check-in recorded yet.</div>
        )}
      </div>

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

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="cash-amount" style={{ display: "block", marginBottom: "0.25rem" }}>
            Cash in hand (₹)
          </label>
          <input
            id="cash-amount"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="bank-amount" style={{ display: "block", marginBottom: "0.25rem" }}>
            Bank account balance (₹)
          </label>
          <input
            id="bank-amount"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="cod-amount" style={{ display: "block", marginBottom: "0.25rem" }}>
            Money in hand that belongs to the platform (COD) (₹) (optional)
          </label>
          <input
            id="cod-amount"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={cod}
            onChange={(e) => setCod(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
          <small style={{ color: "#666" }}>Part of your total cash/bank that must be remitted.</small>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving check-in..." : "Save check-in"}
        </button>
      </form>
    </div>
  );
}
