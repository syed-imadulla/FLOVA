// =====================================================================
// FLOVA Catch Page (Owner: M1)
// Receipt-to-transaction suggestion flow with dual image/text input,
// truthful uncertainty warnings, interactive candidate review,
// and safe user-confirmed persistence via confirmCandidateTransaction().
// =====================================================================

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { paiseToRupeeString, toPaise } from "../lib/money";
import { confirmCandidateTransaction } from "../services/data";
import { extractReceipt } from "../services/receipt";
import {
  SUGGESTED_CATEGORIES,
  type ExpenseType,
  type ExtractedReceiptCandidate,
} from "../types/contracts";

export function FlovaCatchPage() {
  const navigate = useNavigate();

  // Input states
  const [mode, setMode] = useState<"image" | "text">("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");

  // Extraction states
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<ExtractedReceiptCandidate | null>(null);

  // Edit states for candidate review
  const [merchant, setMerchant] = useState("");
  const [amountRupees, setAmountRupees] = useState("");
  const [category, setCategory] = useState("fuel");
  const [expenseType, setExpenseType] = useState<ExpenseType | "">("");
  const [date, setDate] = useState(todayLocalISO());
  const [description, setDescription] = useState("");

  // Confirmation states
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setCandidate(null);

    if (mode === "image" && !selectedFile) {
      setError("Please select or capture a receipt image first.");
      return;
    }
    if (mode === "text" && !pastedText.trim()) {
      setError("Please paste receipt text or an SMS alert.");
      return;
    }

    setExtracting(true);
    try {
      const extracted = await extractReceipt({
        file: mode === "image" ? (selectedFile || undefined) : undefined,
        text: mode === "text" ? pastedText : undefined,
      });

      setCandidate(extracted);

      // Prepopulate form fields from candidate
      setMerchant(extracted.merchant || "");
      setAmountRupees(extracted.amountPaise !== null ? String(paiseToRupeeString(extracted.amountPaise)) : "");
      setCategory(extracted.category || "fuel");
      setExpenseType(extracted.expenseType || "");
      setDate(extracted.date || todayLocalISO());
      setDescription(extracted.description || (extracted.merchant ? `${extracted.merchant} receipt` : ""));
    } catch (err: any) {
      setError(err.message || "Failed to extract receipt.");
    } finally {
      setExtracting(false);
    }
  }

  function handleDiscard() {
    setCandidate(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setPastedText("");
    setError(null);
    setSuccessMessage(null);
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!candidate) return;

    setError(null);

    // Validate amount
    const cleanAmount = amountRupees.replace(/,/g, "").trim();
    const parsedPaise = toPaise(cleanAmount);
    if (isNaN(parsedPaise) || parsedPaise <= 0) {
      setError("Please enter a valid expense amount in rupees.");
      return;
    }

    // Validate living vs work classification
    if (!expenseType) {
      setError("Choose whether this expense is living or work.");
      return;
    }

    setSaving(true);
    try {
      const updatedCandidate: ExtractedReceiptCandidate = {
        ...candidate,
        merchant: merchant.trim() || null,
        amountPaise: parsedPaise,
        category: category || "other",
        expenseType: expenseType,
        date: date || todayLocalISO(),
        description: description.trim() || null,
        needsReview: false,
      };

      await confirmCandidateTransaction(updatedCandidate);

      setSuccessMessage("Receipt transaction saved successfully!");
      setCandidate(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setPastedText("");

      // Brief delay before redirecting to History
      setTimeout(() => {
        navigate("/history");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to confirm and save transaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <p>
        <Link to="/">← Back to Home</Link> | <Link to="/history">Activity History</Link>
      </p>

      <h1>FLOVA Catch</h1>
      <p className="muted">
        Instant receipt-to-transaction assistant for irregular income workers.
        Capture a fuel slip, maintenance bill, or SMS alert to suggest an expense.
      </p>

      {successMessage && (
        <div className="banner" style={{ background: "var(--accent-soft)", color: "var(--text)" }}>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="banner warn">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step 1: Upload or Paste Receipt (when no active candidate) */}
      {!candidate && (
        <div className="card">
          <div className="row" style={{ marginBottom: "1rem" }}>
            <button
              type="button"
              className={`tab ${mode === "image" ? "active" : ""}`}
              onClick={() => { setMode("image"); setError(null); }}
            >
              📷 Photo / Image Upload
            </button>
            <button
              type="button"
              className={`tab ${mode === "text" ? "active" : ""}`}
              onClick={() => { setMode("text"); setError(null); }}
            >
              📝 Paste Text / SMS
            </button>
          </div>

          <form onSubmit={handleExtract}>
            {mode === "image" ? (
              <div>
                <label>
                  Select Receipt Image:
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    disabled={extracting}
                    style={{ marginTop: "6px" }}
                  />
                </label>
                {previewUrl && (
                  <div style={{ marginTop: "10px", marginBottom: "10px", textAlign: "center" }}>
                    <img
                      src={previewUrl}
                      alt="Receipt Preview"
                      style={{ maxHeight: "200px", maxWidth: "100%", borderRadius: "8px", border: "1px solid var(--line)" }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label>
                  Paste Bill or SMS Text:
                  <textarea
                    rows={4}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="e.g. Paid Rs 150.00 to Indian Oil on 20-11-2026 for Petrol via UPI."
                    disabled={extracting}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontFamily: "inherit",
                      marginTop: "6px",
                    }}
                  />
                </label>
              </div>
            )}

            <button type="submit" disabled={extracting} style={{ marginTop: "1rem", width: "100%" }}>
              {extracting ? "Extracting with Groq AI..." : "⚡ Extract Receipt Details"}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Interactive Candidate Review & Edit Screen */}
      {candidate && (
        <div className="card">
          <h2>Review Extracted Suggestion</h2>
          <p className="muted" style={{ fontSize: "13px" }}>
            Receipt data is user-provided information. Review and edit fields before saving.
            {candidate.confidence !== undefined && (
              <span> Extraction confidence: {Math.round(candidate.confidence * 100)}% (model estimate).</span>
            )}
          </p>

          {/* Uncertainty / Missing fields warning */}
          {candidate.needsReview && (
            <div className="banner warn" style={{ fontSize: "13px", marginBottom: "1rem" }}>
              <strong>⚠️ Review Required:</strong>{" "}
              {candidate.missingFields.length > 0 ? (
                <span>
                  The following fields were not clearly detected from the receipt:{" "}
                  <strong>{candidate.missingFields.join(", ")}</strong>. Please verify or fill them in below.
                </span>
              ) : (
                <span>Please verify all extracted fields before saving.</span>
              )}
            </div>
          )}

          <form onSubmit={handleConfirm}>
            <label>
              Merchant / Vendor:
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Shell Petrol Pump"
                required
              />
            </label>

            <label>
              Amount in Rupees (₹):
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="0.00"
                required
              />
            </label>

            <label>
              Date:
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>

            <label>
              Category:
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {SUGGESTED_CATEGORIES.expense.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            {/* Living vs Work Classification — strictly required! */}
            <div style={{ marginBottom: "1rem" }}>
              <span className="label" style={{ fontWeight: 600 }}>
                Expense Type (Required):
              </span>
              <div className="row" style={{ marginTop: "6px" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="expenseType"
                    value="work"
                    checked={expenseType === "work"}
                    onChange={() => setExpenseType("work")}
                  />
                  <span>🛠️ Work (Fuel, bike maintenance, phone)</span>
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="expenseType"
                    value="living"
                    checked={expenseType === "living"}
                    onChange={() => setExpenseType("living")}
                  />
                  <span>🏠 Living (Food, chai, personal)</span>
                </label>
              </div>
            </div>

            <label>
              Description / Notes:
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 2 litres petrol refill"
              />
            </label>

            <div className="row" style={{ marginTop: "1.5rem" }}>
              <button type="submit" disabled={saving} style={{ flex: 1 }}>
                {saving ? "Saving..." : "✓ Confirm & Save to Activity"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={handleDiscard}
                disabled={saving}
              >
                Discard
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
