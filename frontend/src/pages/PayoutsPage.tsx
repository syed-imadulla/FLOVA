import React, { useState } from "react";
import { Link } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { usePayouts } from "../data/usePayouts";
import { formatINR, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import type { Payout, PayoutKind, PayoutStatus } from "../types/contracts";

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
      setSavedMessage("Expected payout added successfully!");
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
    setSavedMessage(null);
    setReceivingPayoutId(p.id);
    const expPaise = toPaise(p.expected_amount);
    const recPaise = toPaise(p.received_amount);
    const remaining = Math.max(0, expPaise - recPaise);
    setReceiveAmountText(String(remaining / 100));
  }

  async function handleConfirmReceive(p: Payout) {
    setError(null);
    const parsed = parseRequiredRupees(receiveAmountText);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    const expPaise = toPaise(p.expected_amount);
    const recPaise = toPaise(p.received_amount);
    const remaining = Math.max(0, expPaise - recPaise);

    if (parsed.paise > remaining) {
      setError(`Cannot receive more than remaining balance of ${formatINR(remaining)}`);
      return;
    }

    setSaving(true);
    try {
      await receive(p.id, parsed.paise, todayLocalISO());
      setSavedMessage(`Received ${formatINR(parsed.paise)} recorded!`);
      setReceivingPayoutId(null);
      setReceiveAmountText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payout receipt");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(p: Payout) {
    if (!window.confirm("Cancel this expected payout?")) return;
    setError(null);
    try {
      await setStatus(p.id, "cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel payout");
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "680px", margin: "0 auto" }}>
      <p><Link to="/">← Back to Home</Link></p>
      <h1>Expected Payouts</h1>
      <p style={{ color: "#555" }}>
        Track upcoming platform earnings, incentives, and client payments.
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

      {/* Add Expected Payout Form */}
      <form onSubmit={handleAddPayout} style={{ border: "1px solid #ccc", padding: "1.25rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Add Expected Payout</h2>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="payout-amount" style={{ display: "block", marginBottom: "0.25rem" }}>
            Expected Amount (₹)
          </label>
          <input
            id="payout-amount"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 1800"
            value={expectedAmountText}
            onChange={(e) => setExpectedAmountText(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="payout-kind" style={{ display: "block", marginBottom: "0.25rem" }}>
            Kind
          </label>
          <select
            id="payout-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as PayoutKind)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px" }}
          >
            <option value="platform_payout">Platform payout</option>
            <option value="incentive">Incentive</option>
            <option value="client_payment">Client payment</option>
            <option value="advance">Advance</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="payout-source" style={{ display: "block", marginBottom: "0.25rem" }}>
            Source / Platform (optional)
          </label>
          <input
            id="payout-source"
            type="text"
            placeholder="e.g. Swiggy, Zomato"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="payout-date" style={{ display: "block", marginBottom: "0.25rem" }}>
            Expected Date (optional, leave blank if unknown)
          </label>
          <input
            id="payout-date"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label htmlFor="payout-status" style={{ display: "block", marginBottom: "0.25rem" }}>
            Certainty Status
          </label>
          <select
            id="payout-status"
            value={status}
            onChange={(e) => setStatusValue(e.target.value as any)}
            disabled={saving}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px" }}
          >
            <option value="scheduled">Scheduled (confirmed by platform)</option>
            <option value="estimated">Estimated (likely but variable)</option>
            <option value="unearned">Unearned (target not yet hit)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", minHeight: "48px", cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Adding..." : "Add Expected Payout"}
        </button>
      </form>

      {/* Payouts list */}
      <h2>Your Payouts</h2>
      {loading && items.length === 0 ? (
        <p>Loading payouts...</p>
      ) : items.length === 0 ? (
        <p>No payouts recorded yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((p) => {
            const expPaise = toPaise(p.expected_amount);
            const recPaise = toPaise(p.received_amount);
            const remaining = Math.max(0, expPaise - recPaise);
            const isReceiving = receivingPayoutId === p.id;

            return (
              <div key={p.id} style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0" }}>
                    {formatINR(expPaise)} — {p.source || p.kind}
                  </h3>
                  <span style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#eee", borderRadius: "3px" }}>
                    {p.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Received:</strong> {formatINR(recPaise)} | <strong>Remaining:</strong> {formatINR(remaining)}
                </p>
                <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                  Expected date: {p.expected_date || "Date unknown"}
                </p>

                {/* Actions */}
                {p.status !== "settled" && p.status !== "cancelled" && (
                  <div style={{ marginTop: "1rem" }}>
                    {!isReceiving ? (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => startReceive(p)}
                          style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", minHeight: "40px", cursor: "pointer" }}
                        >
                          Mark received
                        </button>
                        <button
                          onClick={() => handleCancel(p)}
                          style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", minHeight: "40px", cursor: "pointer", color: "#666" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: "#f0f8ff", padding: "0.75rem", marginTop: "0.5rem", borderRadius: "4px" }}>
                        <label htmlFor={`receive-${p.id}`} style={{ display: "block", marginBottom: "0.25rem" }}>
                          Amount Received (₹):
                        </label>
                        <input
                          id={`receive-${p.id}`}
                          type="text"
                          inputMode="decimal"
                          value={receiveAmountText}
                          onChange={(e) => setReceiveAmountText(e.target.value)}
                          disabled={saving}
                          style={{ width: "100%", padding: "0.5rem", fontSize: "1rem", marginBottom: "0.5rem" }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleConfirmReceive(p)}
                            disabled={saving}
                            style={{ padding: "0.5rem 1rem", cursor: saving ? "not-allowed" : "pointer" }}
                          >
                            {saving ? "Saving..." : "Confirm Received"}
                          </button>
                          <button
                            onClick={() => setReceivingPayoutId(null)}
                            disabled={saving}
                            style={{ padding: "0.5rem 1rem" }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
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
