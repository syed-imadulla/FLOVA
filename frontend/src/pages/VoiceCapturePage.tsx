// =====================================================================
// FLOVA Voice Capture Page (M4)
// Pipeline: Microphone → Transcript → Extraction → Edit → Confirm → Save
// Uses browser Web Speech API (no API key required).
// Saves via useTransactions hook (source: "voice") per CONTRACT.md.
// =====================================================================

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { useTransactions } from "../data/useTransactions";
import { formatINR, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import {
  SUGGESTED_CATEGORIES,
  type ExpenseType,
  type TransactionType,
} from "../types/contracts";
import { extractTransaction } from "../voice/extractTransaction";
import { useVoiceRecorder } from "../voice/useVoiceRecorder";

// ---- Styles (inline to avoid CSS conflicts) ----
const btn = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: "0.75rem 1.25rem",
  fontSize: "1rem",
  minHeight: "48px",
  borderRadius: "6px",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  ...extra,
});

const card: React.CSSProperties = {
  padding: "1.25rem",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  marginBottom: "1.25rem",
  backgroundColor: "#fff",
};

type Step = "record" | "review" | "saved";

export function VoiceCapturePage() {
  const navigate = useNavigate();
  const { add } = useTransactions();
  const recorder = useVoiceRecorder();

  const [step, setStep] = useState<Step>("record");
  const [editedTranscript, setEditedTranscript] = useState("");
  const [extractionDone, setExtractionDone] = useState(false);

  // Editable transaction fields (pre-populated from extraction)
  const [txType, setTxType] = useState<TransactionType>("expense");
  const [amountText, setAmountText] = useState("");
  const [category, setCategory] = useState("other");
  const [expenseType, setExpenseType] = useState<ExpenseType | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayLocalISO());

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedTx, setSavedTx] = useState<{ id: string; amount: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  // ---- Step 1: Proceed from recording to review ----
  function handleProceedToReview() {
    const text = recorder.transcript || editedTranscript;
    if (!text.trim()) {
      return; // Shouldn't happen — button disabled
    }
    const dto = extractTransaction(text.trim());
    const tx = dto.transaction;

    if (tx) {
      setTxType(tx.type ?? "expense");
      setAmountText(tx.amount ?? "");
      setCategory(tx.category ?? (tx.type === "income" ? "earnings" : "other"));
      setExpenseType(tx.expense_type ?? "");
      setDescription(tx.description ?? "");
      setDate(tx.date ?? todayLocalISO());
      setExtractionDone(true);
    } else {
      // unknown intent — go to review with blanks
      setTxType("expense");
      setAmountText("");
      setCategory("other");
      setExpenseType("");
      setDescription(text.trim());
      setDate(todayLocalISO());
      setExtractionDone(false);
    }

    setEditedTranscript(text.trim());
    setStep("review");
    setSaveError(null);
    setFieldErrors({});
  }

  // ---- Step 2: Validate & Save ----
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setFieldErrors({});

    const errors: Partial<Record<string, string>> = {};

    const amountRes = parseRequiredRupees(amountText);
    if (!amountRes.ok) errors.amount = amountRes.message;

    if (txType === "expense" && !expenseType) {
      errors.expenseType = "Choose whether this is a living or work expense.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const confirmedAmount = amountRes.ok ? amountRes.paise : 0;

    setSaving(true);
    try {
      const saved = await add({
        type: txType,
        amount: confirmedAmount,
        category: category || "other",
        description: description.trim() || undefined,
        expenseType: txType === "expense" && expenseType ? expenseType : undefined,
        ownership: "mine",
        date,
        source: "voice",
      });
      setSavedTx({
        id: saved.id,
        amount: formatINR(toPaise(saved.amount)),
      });
      setStep("saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  }

  // ---- Render ----
  if (step === "saved" && savedTx) {
    return (
      <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
        <p><Link to="/">← Home</Link></p>
        <div style={{ ...card, border: "2px solid #22c55e", backgroundColor: "#f0fdf4", textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }}>✓</div>
          <h2 style={{ color: "#166534", margin: "0.5rem 0" }}>Saved!</h2>
          <p style={{ fontSize: "1.1rem", color: "#15803d" }}>
            {txType === "income" ? "Income" : "Expense"} of{" "}
            <strong>{savedTx.amount}</strong> recorded from voice.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button style={btn({ background: "#1a365d", color: "#fff", flex: 1 })} onClick={() => {
            recorder.clearTranscript();
            setStep("record");
            setSavedTx(null);
            setAmountText("");
            setDescription("");
          }}>
            🎙 Record Another
          </button>
          <button style={btn({ background: "#f1f5f9", flex: 1, color: "#334155" })} onClick={() => navigate("/history")}>
            View Activity
          </button>
          <button style={btn({ background: "#f1f5f9", flex: 1, color: "#334155" })} onClick={() => navigate("/")}>
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (step === "review") {
    const categoryPresets = txType === "income"
      ? SUGGESTED_CATEGORIES.income
      : SUGGESTED_CATEGORIES.expense;

    return (
      <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
        <p><Link to="/">← Home</Link> | <button style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "1rem", padding: 0 }} onClick={() => setStep("record")}>← Re-record</button></p>
        <h1 style={{ marginBottom: "0.25rem" }}>Confirm Transaction</h1>

        {/* Transcript display */}
        <div style={{ ...card, background: "#f8fafc" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
            What you said
          </div>
          <p style={{ margin: 0, fontStyle: "italic", color: "#334155" }}>
            "{editedTranscript}"
          </p>
          {!extractionDone && (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "#b45309" }}>
              ⚠ Could not automatically identify a transaction. Please fill in the details below.
            </p>
          )}
        </div>

        {saveError && (
          <div role="alert" style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "0.75rem", marginBottom: "1rem" }}>
            {saveError}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Type */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Type</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {(["income", "expense"] as TransactionType[]).map((t) => (
                <label key={t} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "0.5rem", padding: "0.75rem", borderRadius: 6, cursor: "pointer",
                  border: `2px solid ${txType === t ? (t === "income" ? "#22c55e" : "#ef4444") : "#e2e8f0"}`,
                  background: txType === t ? (t === "income" ? "#f0fdf4" : "#fef2f2") : "#fff",
                  fontWeight: txType === t ? 700 : 400,
                }}>
                  <input type="radio" name="type" value={t} checked={txType === t}
                    onChange={() => {
                      setTxType(t);
                      setCategory(t === "income" ? "earnings" : "fuel");
                      if (t === "income") setExpenseType("");
                      else setExpenseType("work");
                    }}
                    style={{ display: "none" }}
                  />
                  {t === "income" ? "💰 Income" : "💸 Expense"}
                </label>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="voice-amount" style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
              Amount (₹) <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="voice-amount"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 150"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              autoFocus
              style={{
                width: "100%", padding: "0.75rem", fontSize: "1.1rem",
                borderRadius: 6, border: `2px solid ${fieldErrors.amount ? "#dc2626" : "#e2e8f0"}`,
                boxSizing: "border-box",
              }}
            />
            {fieldErrors.amount && (
              <p style={{ color: "#dc2626", margin: "0.25rem 0 0", fontSize: "0.85rem" }}>{fieldErrors.amount}</p>
            )}
          </div>

          {/* Expense type */}
          {txType === "expense" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                Expense Type <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {([["living", "🏠 Living (food, personal)"], ["work", "⚙️ Work (fuel, phone)"]] as [ExpenseType, string][]).map(([v, label]) => (
                  <label key={v} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0.6rem", borderRadius: 6, cursor: "pointer", fontSize: "0.9rem",
                    border: `2px solid ${expenseType === v ? "#1a365d" : "#e2e8f0"}`,
                    background: expenseType === v ? "#ebf4ff" : "#fff",
                    fontWeight: expenseType === v ? 700 : 400,
                  }}>
                    <input type="radio" name="expenseType" value={v} checked={expenseType === v}
                      onChange={() => setExpenseType(v)} style={{ display: "none" }} />
                    {label}
                  </label>
                ))}
              </div>
              {fieldErrors.expenseType && (
                <p style={{ color: "#dc2626", margin: "0.25rem 0 0", fontSize: "0.85rem" }}>{fieldErrors.expenseType}</p>
              )}
            </div>
          )}

          {/* Category */}
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="voice-category" style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Category</label>
            <select
              id="voice-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", borderRadius: 6, border: "2px solid #e2e8f0", minHeight: "48px" }}
            >
              {categoryPresets.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="voice-desc" style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Description (optional)</label>
            <input
              id="voice-desc"
              type="text"
              placeholder="Notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", borderRadius: 6, border: "2px solid #e2e8f0", boxSizing: "border-box" }}
            />
          </div>

          {/* Date */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="voice-date" style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Date</label>
            <input
              id="voice-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", borderRadius: 6, border: "2px solid #e2e8f0", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={btn({
              width: "100%",
              background: saving ? "#94a3b8" : "#1a365d",
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
            })}
          >
            {saving ? "Saving…" : "✓ Confirm & Save Transaction"}
          </button>
        </form>
      </div>
    );
  }

  // ---- Step: Record ----
  const { state, transcript, interimTranscript, durationSeconds, errorMessage, supportsWebSpeech, startRecording, stopRecording, clearTranscript } = recorder;
  const isRecording = state === "recording";
  const isDone = state === "done";
  const isError = state === "error";
  const hasTranscript = (transcript || editedTranscript).trim().length > 0;

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
      <p><Link to="/">← Home</Link> | <Link to="/add">Manual Entry</Link></p>
      <h1 style={{ marginBottom: "0.25rem" }}>🎙 Voice Entry</h1>
      <p style={{ color: "#64748b", marginTop: 0, marginBottom: "1.5rem" }}>
        Say something like: <em>"I earned ₹1500 today"</em> or <em>"Spent 200 on petrol"</em>
      </p>

      {!supportsWebSpeech && (
        <div style={{ ...card, background: "#fff8e6", border: "1px solid #ffd591" }}>
          <strong style={{ color: "#d46b08" }}>⚠ Voice recognition not supported in this browser.</strong>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", color: "#78350f" }}>
            Use Chrome or Edge for voice input, or type your transaction below.
          </p>
        </div>
      )}

      {/* Recording button */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={state === "requesting"}
            style={btn({
              background: state === "requesting" ? "#94a3b8" : "#dc2626",
              color: "#fff",
              borderRadius: "50%",
              width: "100px",
              height: "100px",
              fontSize: "2.5rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(220,38,38,0.4)",
            })}
            aria-label="Start recording"
          >
            {state === "requesting" ? "…" : "🎙"}
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={btn({
              background: "#1a365d",
              color: "#fff",
              borderRadius: "50%",
              width: "100px",
              height: "100px",
              fontSize: "2rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 1.4s ease-in-out infinite",
              boxShadow: "0 0 0 4px rgba(220,38,38,0.3)",
            })}
            aria-label="Stop recording"
          >
            ⏹
          </button>
        )}

        {/* Status line */}
        <div style={{ marginTop: "0.75rem", fontSize: "0.95rem", color: "#64748b", minHeight: "1.5rem" }}>
          {state === "requesting" && "Requesting microphone…"}
          {isRecording && (
            <span>
              <span style={{ color: "#dc2626", fontWeight: 700 }}>● REC</span>{" "}
              {formatDuration(durationSeconds)} — tap ⏹ to stop
            </span>
          )}
          {isDone && !hasTranscript && "Recording stopped. Type your transaction below."}
          {state === "idle" && supportsWebSpeech && "Tap 🎙 to start speaking"}
          {state === "idle" && !supportsWebSpeech && "Type your transaction below"}
        </div>

        {/* Interim transcript (live) */}
        {interimTranscript && (
          <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "#f1f5f9", borderRadius: 6, color: "#64748b", fontStyle: "italic", fontSize: "0.95rem" }}>
            {interimTranscript}…
          </div>
        )}
      </div>

      {/* Error */}
      {isError && errorMessage && (
        <div role="alert" style={{ ...card, background: "#fef2f2", border: "1px solid #fecaca" }}>
          <strong style={{ color: "#dc2626" }}>⚠ {errorMessage}</strong>
        </div>
      )}

      {/* Transcript / Manual input */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label htmlFor="voice-transcript" style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
          {hasTranscript ? "Transcript (edit if needed)" : "Or type your transaction"}
        </label>
        <textarea
          id="voice-transcript"
          rows={3}
          placeholder='e.g. "Spent 200 on petrol" or "Earned 1500 today"'
          value={transcript || editedTranscript}
          onChange={(e) => {
            if (transcript) {
              // User editing — override the recorder's transcript via recorder.setTranscript
              recorder.setTranscript(e.target.value);
            } else {
              setEditedTranscript(e.target.value);
            }
          }}
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            borderRadius: 6,
            border: "2px solid #e2e8f0",
            boxSizing: "border-box",
            resize: "vertical",
            minHeight: "80px",
          }}
        />
        {hasTranscript && (
          <button
            onClick={() => { clearTranscript(); setEditedTranscript(""); }}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.85rem", padding: "0.25rem 0" }}
          >
            ✕ Clear and re-record
          </button>
        )}
      </div>

      <button
        onClick={handleProceedToReview}
        disabled={!hasTranscript}
        style={btn({
          width: "100%",
          background: hasTranscript ? "#1a365d" : "#cbd5e1",
          color: hasTranscript ? "#fff" : "#94a3b8",
          cursor: hasTranscript ? "pointer" : "not-allowed",
        })}
      >
        → Extract &amp; Review Transaction
      </button>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  );
}
