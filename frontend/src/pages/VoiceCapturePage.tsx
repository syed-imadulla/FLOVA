// =====================================================================
// FLOVA Voice Capture & Financial Intent Page (Owner: M2, M1 & M4)
// Pipeline: Audio / Text → Groq Whisper + Llama 3.3 → FinancialExtractionDTO
// Intents Supported:
// 1. Transaction: Review & edit candidate → confirmCandidateTransaction()
// 2. Expected Payout: Future earnings advisory → addPayout()
// 3. Balance Check-in: Baseline update → addCheckin()
// 4. Financial Query: Deterministic runway & balance answer via M3 engine
// Zero automatic database mutations. Preserves candidate UUID for idempotency.
// =====================================================================

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { todayLocalISO } from "../data/dates";
import { useRunway } from "../runway/useRunway";
import {
  addCheckin,
  addPayout,
  confirmCandidateTransaction,
} from "../services/data";
import {
  processVoice,
  resolveFinancialQuery,
  type QueryResolutionResult,
} from "../services/voice";
import { useAudioRecorder } from "../voice/useAudioRecorder";
import { useVoiceRecorder } from "../voice/useVoiceRecorder";
import { paiseToRupeeString, toPaise } from "../lib/money";
import { parseRequiredRupees } from "../profile/parseRupees";
import {
  SUGGESTED_CATEGORIES,
  type ExpenseType,
  type FinancialExtractionDTO,
  type Transaction,
  type TransactionType,
  type VoiceTransactionCandidate,
} from "../types/contracts";

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

type ViewState = "input" | "processing" | "review_transaction" | "view_payout" | "view_checkin" | "view_query" | "unknown" | "saved";

export function VoiceCapturePage() {
  const navigate = useNavigate();
  const audioRecorder = useAudioRecorder();
  const speechRecorder = useVoiceRecorder();
  const { runway, rawInput } = useRunway();

  const [captureMode, setCaptureMode] = useState<"whisper" | "live_speech">("whisper");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("auto");
  const [viewState, setViewState] = useState<ViewState>("input");
  const [typedText, setTypedText] = useState("");
  const [processingStatus, setProcessingStatus] = useState<string>("Analyzing voice note…");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extraction results
  const [extractionDTO, setExtractionDTO] = useState<FinancialExtractionDTO | null>(null);
  const [currentCandidate, setCurrentCandidate] = useState<VoiceTransactionCandidate | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResolutionResult | null>(null);

  // Editable transaction candidate fields
  const [txType, setTxType] = useState<TransactionType>("expense");
  const [amountRupees, setAmountRupees] = useState("");
  const [category, setCategory] = useState("other");
  const [expenseType, setExpenseType] = useState<ExpenseType | "">("");
  const [description, setDescription] = useState("");
  const [txDate, setTxDate] = useState(todayLocalISO());
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [, setSavedTransaction] = useState<Transaction | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // ---- Handle Voice or Text Submission ----
  async function handleProcess(audioBlobToProcess?: Blob | null, textToProcess?: string) {
    setErrorMessage(null);
    setFieldErrors({});

    const blob = audioBlobToProcess !== undefined ? audioBlobToProcess : audioRecorder.audioBlob;
    const text = textToProcess !== undefined ? textToProcess : typedText.trim();

    if (!blob && !text) {
      setErrorMessage("Please record audio or type a financial statement.");
      return;
    }

    setViewState("processing");
    setProcessingStatus(blob ? "Transcribing audio via Groq Whisper…" : "Analyzing financial intent with Groq…");

    try {
      const result = await processVoice({
        audioBlob: blob || undefined,
        mimeType: audioRecorder.mimeType || undefined,
        text: text || undefined,
        candidateId: currentCandidate?.id,
        language: selectedLanguage !== "auto" ? selectedLanguage : undefined,
      });

      setExtractionDTO(result.extraction);

      // Route by entry_intent
      if (result.extraction.entry_intent === "transaction") {
        const cand = result.candidate;
        if (cand) {
          setCurrentCandidate(cand);
          setTxType(cand.type || "expense");
          setAmountRupees(cand.amountPaise !== null ? String(paiseToRupeeString(cand.amountPaise)) : "");
          setCategory(cand.category || (cand.type === "income" ? "earnings" : "other"));
          setExpenseType(cand.expenseType || "");
          setDescription(cand.transcript || "");
          setTxDate(cand.date || todayLocalISO());
        } else {
          setTxType("expense");
          setAmountRupees("");
          setCategory("other");
          setExpenseType("");
          setDescription(result.transcript);
          setTxDate(todayLocalISO());
        }
        setViewState("review_transaction");
      } else if (result.extraction.entry_intent === "expected_payout") {
        setViewState("view_payout");
      } else if (result.extraction.entry_intent === "balance_checkin") {
        setViewState("view_checkin");
      } else if (result.extraction.entry_intent === "financial_query" || result.extraction.entry_intent === "query") {
        const queryData = result.extraction.financial_query || result.extraction.query || {
          query_type: "general",
          target_date: null,
          target_entity: null,
        };
        const resolved = resolveFinancialQuery(queryData, rawInput, runway);
        setQueryResult(resolved);
        setViewState("view_query");
      } else {
        setViewState("unknown");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process voice note.");
      setViewState("input");
    }
  }

  // ---- Confirm Candidate Transaction ----
  async function handleConfirmTransaction(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const errors: Partial<Record<string, string>> = {};
    const parsedAmount = parseRequiredRupees(amountRupees);
    if (!parsedAmount.ok) {
      errors.amount = parsedAmount.message;
    }

    if (txType === "expense" && !expenseType) {
      errors.expenseType = "Expense type is required: choose living (food/personal) or work (fuel/phone).";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const confirmedAmountPaise = parsedAmount.ok ? parsedAmount.paise : 0;
    const candidateToConfirm: VoiceTransactionCandidate = {
      id: currentCandidate?.id || (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : undefined),
      transcript: description || currentCandidate?.transcript || "Voice transaction",
      type: txType,
      amountPaise: confirmedAmountPaise,
      category: category || "other",
      expenseType: txType === "expense" && expenseType ? expenseType : null,
      date: txDate,
      ownership: "mine",
      needsReview: false,
      missingFields: [],
    };

    setSaving(true);
    try {
      const saved = await confirmCandidateTransaction(candidateToConfirm);
      setSavedTransaction(saved);
      setSavedNotice(`Recorded ₹${paiseToRupeeString(confirmedAmountPaise)} as ${txType === "income" ? "income" : `${expenseType} expense`}.`);
      setViewState("saved");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to confirm transaction.");
    } finally {
      setSaving(false);
    }
  }

  // ---- Confirm Expected Payout ----
  async function handleConfirmPayout() {
    if (!extractionDTO?.expected_payout) return;
    const ep = extractionDTO.expected_payout;
    const amountPaise = ep.expected_amount ? toPaise(ep.expected_amount) : 0;
    if (amountPaise <= 0) {
      setErrorMessage("Expected payout amount is missing or invalid.");
      return;
    }

    setSaving(true);
    try {
      await addPayout({
        expected: amountPaise,
        kind: ep.kind || "platform_payout",
        source: ep.source || undefined,
        expectedDate: ep.expected_date || null,
        status: "scheduled",
        note: ep.note || undefined,
      });
      setSavedNotice(`Scheduled expected payout of ₹${paiseToRupeeString(amountPaise)} from ${ep.source || ep.kind || "Platform"}.`);
      setViewState("saved");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save expected payout.");
    } finally {
      setSaving(false);
    }
  }

  // ---- Confirm Balance Check-in ----
  async function handleConfirmCheckin() {
    if (!extractionDTO?.balance_checkin) return;
    const bc = extractionDTO.balance_checkin;
    const cashPaise = bc.cash_amount ? toPaise(bc.cash_amount) : 0;
    const bankPaise = bc.bank_amount ? toPaise(bc.bank_amount) : 0;
    const notMinePaise = bc.not_mine_amount ? toPaise(bc.not_mine_amount) : 0;

    setSaving(true);
    try {
      await addCheckin({
        cash: cashPaise,
        bank: bankPaise,
        notMine: notMinePaise,
        note: bc.note || "Voice check-in",
      });
      setSavedNotice(`Balance baseline recorded: Cash ₹${paiseToRupeeString(cashPaise)}, Bank ₹${paiseToRupeeString(bankPaise)}.`);
      setViewState("saved");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save balance check-in.");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setCurrentCandidate(null);
    setExtractionDTO(null);
    setQueryResult(null);
    audioRecorder.resetRecording();
    setTypedText("");
    setErrorMessage(null);
    setFieldErrors({});
    setViewState("input");
  }

  // ===================================================================
  // RENDER: Saved Confirmation View
  // ===================================================================
  if (viewState === "saved") {
    return (
      <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
        <p><Link to="/">← Home</Link></p>
        <div style={{ ...card, border: "2px solid #22c55e", backgroundColor: "#f0fdf4", textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }}>✓</div>
          <h2 style={{ color: "#166534", margin: "0.5rem 0" }}>Saved Successfully!</h2>
          <p style={{ fontSize: "1.1rem", color: "#15803d" }}>{savedNotice}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            style={btn({ background: "#1a365d", color: "#fff", flex: 1 })}
            onClick={() => {
              handleDiscard();
            }}
          >
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

  // ===================================================================
  // RENDER: Processing View
  // ===================================================================
  if (viewState === "processing") {
    return (
      <div style={{ padding: "3rem 1.5rem", maxWidth: "540px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚡</div>
        <h2>{processingStatus}</h2>
        <p style={{ color: "#64748b" }}>Transcribing with Groq Whisper and classifying financial intent…</p>
      </div>
    );
  }

  // ===================================================================
  // RENDER: Financial Query Result View
  // ===================================================================
  if (viewState === "view_query" && queryResult) {
    return (
      <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
        <p><Link to="/">← Home</Link> | <button style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "1rem", padding: 0 }} onClick={handleDiscard}>← Ask Another</button></p>
        <h1 style={{ marginBottom: "0.25rem" }}>Financial Query Answer</h1>
        <p style={{ color: "#64748b", margin: "0 0 1rem" }}>
          Query: <em>"{extractionDTO?.metadata.raw_utterance}"</em>
        </p>

        <div style={{ ...card, border: "2px solid #3b82f6", background: "#eff6ff" }}>
          <div style={{ display: "inline-block", background: "#dbeafe", color: "#1e40af", padding: "0.2rem 0.5rem", borderRadius: 4, fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            ✓ Verified by Deterministic Runway Engine
          </div>
          <h2 style={{ color: "#1e3a8a", margin: "0.5rem 0" }}>{queryResult.answer}</h2>
          <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem", color: "#1e40af", fontSize: "0.95rem" }}>
            {queryResult.details.map((d, i) => (
              <li key={i} style={{ marginBottom: "0.25rem" }}>{d}</li>
            ))}
          </ul>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button style={btn({ background: "#1a365d", color: "#fff", flex: 1 })} onClick={handleDiscard}>
            🎙 Ask Another Question
          </button>
          <button style={btn({ background: "#f1f5f9", color: "#334155", flex: 1 })} onClick={() => navigate("/")}>
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ===================================================================
  // RENDER: Expected Payout View
  // ===================================================================
  if (viewState === "view_payout" && extractionDTO?.expected_payout) {
    const ep = extractionDTO.expected_payout;
    return (
      <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
        <p><Link to="/">← Home</Link> | <button style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "1rem", padding: 0 }} onClick={handleDiscard}>← Re-record</button></p>
        <h1 style={{ marginBottom: "0.25rem" }}>Expected Payout Detected</h1>
        <p style={{ color: "#64748b", margin: "0 0 1rem" }}>
          Utterance: <em>"{extractionDTO.metadata.raw_utterance}"</em>
        </p>

        <div style={{ ...card, border: "2px solid #8b5cf6", background: "#f5f3ff" }}>
          <div style={{ display: "inline-block", background: "#ede9fe", color: "#6d28d9", padding: "0.2rem 0.5rem", borderRadius: 4, fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Upcoming Platform Payout (Forward-Looking)
          </div>
          <h2 style={{ color: "#5b21b6", margin: "0.5rem 0" }}>
            ₹{ep.expected_amount || "Unspecified"} from {ep.source || "Platform"}
          </h2>
          <p style={{ color: "#6d28d9", fontSize: "0.95rem", margin: 0 }}>
            {ep.expected_date ? `Expected on ${ep.expected_date}` : "Expected date unconfirmed"}.
          </p>
          <div style={{ marginTop: "0.75rem", padding: "0.5rem", background: "#fff", borderRadius: 6, fontSize: "0.85rem", color: "#7c3aed" }}>
            ℹ️ Expected payouts are future earnings and do <strong>not</strong> alter your confirmed liquid balance today.
          </div>
        </div>

        {errorMessage && (
          <div role="alert" style={{ color: "#dc2626", background: "#fef2f2", padding: "0.75rem", borderRadius: 6, marginBottom: "1rem" }}>
            {errorMessage}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            style={btn({ background: "#6d28d9", color: "#fff", flex: 2 })}
            onClick={handleConfirmPayout}
            disabled={saving || !ep.expected_amount}
          >
            {saving ? "Saving…" : "✓ Add to Expected Payouts"}
          </button>
          <button style={btn({ background: "#f1f5f9", color: "#334155", flex: 1 })} onClick={handleDiscard}>
            Discard
          </button>
        </div>
      </div>
    );
  }

  // ===================================================================
  // RENDER: Balance Check-in View
  // ===================================================================
  if (viewState === "view_checkin" && extractionDTO?.balance_checkin) {
    const bc = extractionDTO.balance_checkin;
    return (
      <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
        <p><Link to="/">← Home</Link> | <button style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "1rem", padding: 0 }} onClick={handleDiscard}>← Re-record</button></p>
        <h1 style={{ marginBottom: "0.25rem" }}>Balance Check-in Detected</h1>
        <p style={{ color: "#64748b", margin: "0 0 1rem" }}>
          Utterance: <em>"{extractionDTO.metadata.raw_utterance}"</em>
        </p>

        <div style={{ ...card, border: "2px solid #0284c7", background: "#f0f9ff" }}>
          <div style={{ display: "inline-block", background: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.5rem", borderRadius: 4, fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Verified Balance Baseline
          </div>
          <h2 style={{ color: "#075985", margin: "0.5rem 0" }}>
            Cash: ₹{bc.cash_amount || "0"} | Bank: ₹{bc.bank_amount || "0"}
          </h2>
          {bc.not_mine_amount && Number(bc.not_mine_amount) > 0 && (
            <p style={{ color: "#c2410c", margin: "0.25rem 0 0", fontSize: "0.95rem" }}>
              ⚠️ Custodial COD money: ₹{bc.not_mine_amount} (segregated from personal balance)
            </p>
          )}
          <div style={{ marginTop: "0.75rem", padding: "0.5rem", background: "#fff", borderRadius: 6, fontSize: "0.85rem", color: "#0369a1" }}>
            ℹ️ Balance check-ins establish your starting cash baseline and are not counted as income or expenses.
          </div>
        </div>

        {errorMessage && (
          <div role="alert" style={{ color: "#dc2626", background: "#fef2f2", padding: "0.75rem", borderRadius: 6, marginBottom: "1rem" }}>
            {errorMessage}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button style={btn({ background: "#0284c7", color: "#fff", flex: 2 })} onClick={handleConfirmCheckin} disabled={saving}>
            {saving ? "Saving…" : "✓ Confirm Balance Check-in"}
          </button>
          <button style={btn({ background: "#f1f5f9", color: "#334155", flex: 1 })} onClick={handleDiscard}>
            Discard
          </button>
        </div>
      </div>
    );
  }

  // ===================================================================
  // RENDER: Unknown / Ambiguous View
  // ===================================================================
  if (viewState === "unknown") {
    return (
      <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
        <p><Link to="/">← Home</Link> | <button style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "1rem", padding: 0 }} onClick={handleDiscard}>← Try Again</button></p>
        <h1 style={{ marginBottom: "0.25rem" }}>Could Not Identify Financial Intent</h1>
        <div style={{ ...card, background: "#fffbeb", border: "1px solid #fde68a" }}>
          <p style={{ margin: 0, fontStyle: "italic", color: "#78350f" }}>
            "{extractionDTO?.metadata.raw_utterance}"
          </p>
          {extractionDTO?.metadata.clarification_reason && (
            <p style={{ margin: "0.5rem 0 0", color: "#b45309", fontSize: "0.9rem" }}>
              {extractionDTO.metadata.clarification_reason}
            </p>
          )}
        </div>

        <p style={{ color: "#64748b" }}>Please speak clearly or type a financial transaction below:</p>
        <button
          style={btn({ background: "#1a365d", color: "#fff", width: "100%", marginBottom: "0.75rem" })}
          onClick={handleDiscard}
        >
          🎙 Try Speaking Again
        </button>
        <button
          style={btn({ background: "#f1f5f9", color: "#334155", width: "100%" })}
          onClick={() => {
            setDescription(extractionDTO?.metadata.raw_utterance || "");
            setTxType("expense");
            setAmountRupees("");
            setCategory("other");
            setExpenseType("");
            setTxDate(todayLocalISO());
            setViewState("review_transaction");
          }}
        >
          ✍️ Fill Details Manually
        </button>
      </div>
    );
  }

  // ===================================================================
  // RENDER: Transaction Candidate Review View
  // ===================================================================
  if (viewState === "review_transaction") {
    const categoryPresets = txType === "income" ? SUGGESTED_CATEGORIES.income : SUGGESTED_CATEGORIES.expense;
    const isUnderReview = currentCandidate?.needsReview || extractionDTO?.metadata.clarification_required;

    return (
      <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
        <p>
          <Link to="/">← Home</Link> |{" "}
          <button style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "1rem", padding: 0 }} onClick={handleDiscard}>
            ← Re-record
          </button>
        </p>
        <h1 style={{ marginBottom: "0.25rem" }}>Confirm Transaction</h1>

        {/* Utterance preview */}
        <div style={{ ...card, background: "#f8fafc" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
            Spoken Utterance
          </div>
          <p style={{ margin: 0, fontStyle: "italic", color: "#334155" }}>
            "{description || currentCandidate?.transcript}"
          </p>
        </div>

        {/* Clarification / Missing fields banner */}
        {isUnderReview && (
          <div style={{ ...card, background: "#fffbeb", border: "1px solid #fde68a", marginBottom: "1rem" }}>
            <strong style={{ color: "#b45309" }}>⚠️ Review Required</strong>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#78350f" }}>
              {extractionDTO?.metadata.clarification_reason || "Please verify the amount and ensure living/work classification is selected."}
            </p>
            {extractionDTO?.metadata.clarification_questions && extractionDTO.metadata.clarification_questions.length > 0 && (
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", color: "#92400e", fontSize: "0.85rem" }}>
                {extractionDTO.metadata.clarification_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {errorMessage && (
          <div role="alert" style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "0.75rem", marginBottom: "1rem" }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleConfirmTransaction}>
          {/* Type: Income / Expense */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>Type</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {(["income", "expense"] as TransactionType[]).map((t) => (
                <label
                  key={t}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    borderRadius: 6,
                    cursor: "pointer",
                    border: `2px solid ${txType === t ? (t === "income" ? "#22c55e" : "#ef4444") : "#e2e8f0"}`,
                    background: txType === t ? (t === "income" ? "#f0fdf4" : "#fef2f2") : "#fff",
                    fontWeight: txType === t ? 700 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={txType === t}
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
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              autoFocus={!amountRupees}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1.1rem",
                borderRadius: 6,
                border: `2px solid ${fieldErrors.amount ? "#dc2626" : "#e2e8f0"}`,
                boxSizing: "border-box",
              }}
            />
            {fieldErrors.amount && <p style={{ color: "#dc2626", margin: "0.25rem 0 0", fontSize: "0.85rem" }}>{fieldErrors.amount}</p>}
          </div>

          {/* Living vs Work classification (strictly required for expenses) */}
          {txType === "expense" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                Expense Type <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {([["living", "🏠 Living (food, personal)"], ["work", "⚙️ Work (fuel, phone)"]] as [ExpenseType, string][]).map(([v, label]) => (
                  <label
                    key={v}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.6rem",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      border: `2px solid ${expenseType === v ? "#1a365d" : "#e2e8f0"}`,
                      background: expenseType === v ? "#ebf4ff" : "#fff",
                      fontWeight: expenseType === v ? 700 : 400,
                    }}
                  >
                    <input
                      type="radio"
                      name="expenseType"
                      value={v}
                      checked={expenseType === v}
                      onChange={() => setExpenseType(v)}
                      style={{ display: "none" }}
                    />
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
            <label htmlFor="voice-category" style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
              Category
            </label>
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
            <label htmlFor="voice-desc" style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
              Description
            </label>
            <input
              id="voice-desc"
              type="text"
              placeholder="Notes or details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", borderRadius: 6, border: "2px solid #e2e8f0", boxSizing: "border-box" }}
            />
          </div>

          {/* Date */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="voice-date" style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
              Date
            </label>
            <input
              id="voice-date"
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", borderRadius: 6, border: "2px solid #e2e8f0", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="submit"
              disabled={saving}
              style={btn({
                flex: 2,
                background: saving ? "#94a3b8" : "#1a365d",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
              })}
            >
              {saving ? "Saving…" : "✓ Confirm & Save Transaction"}
            </button>
            <button
              type="button"
              style={btn({ flex: 1, background: "#f1f5f9", color: "#334155" })}
              onClick={handleDiscard}
            >
              Discard
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ===================================================================
  // RENDER: Default Input View (Recording + Text Fallback)
  // ===================================================================
  const isRecording = audioRecorder.status === "recording";
  const isStopped = audioRecorder.status === "stopped";
  const hasAudio = audioRecorder.audioBlob !== null;
  const hasText = typedText.trim().length > 0;

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto" }}>
      <p><Link to="/">← Home</Link> | <Link to="/add">Manual Entry</Link></p>
      <h1 style={{ marginBottom: "0.25rem" }}>🎙 Voice Entry &amp; Assistant</h1>
      <p style={{ color: "#64748b", marginTop: 0, marginBottom: "1.5rem" }}>
        Record a transaction, check-in, or ask a question:
        <br />
        <em>"Spent 120 on petrol"</em>, <em>"Swiggy payout 1800 on Monday"</em>, or <em>"How much money do I have left?"</em>
      </p>

      {/* Language Selector (Phase 9.1 Multilingual Support) */}
      <div style={{ marginBottom: "1.25rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
          <label htmlFor="voice-language-select" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
            🌐 Language (ಭಾಷೆ / भाषा / زبان / భాష)
          </label>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
            {selectedLanguage === "auto" ? "Groq Whisper Auto-Detect" : `Pinned to ${selectedLanguage.toUpperCase()}`}
          </span>
        </div>
        <select
          id="voice-language-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            fontSize: "0.95rem",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#fff",
            color: "#1e293b",
            fontWeight: 500,
          }}
        >
          <option value="auto">🌐 Auto Detect (स्वचालित / ಸ್ವಯಂಚಾಲಿತ)</option>
          <option value="en">English (India)</option>
          <option value="hi">Hindi (हिंदी)</option>
          <option value="kn">Kannada (ಕನ್ನಡ)</option>
          <option value="ur">Urdu (اردو)</option>
          <option value="te">Telugu (తెలుగు)</option>
        </select>
      </div>

      {/* Mode Selector */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", background: "#f1f5f9", padding: "0.25rem", borderRadius: "8px" }}>
        <button
          type="button"
          onClick={() => setCaptureMode("whisper")}
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            background: captureMode === "whisper" ? "#fff" : "transparent",
            color: captureMode === "whisper" ? "#1a365d" : "#64748b",
            boxShadow: captureMode === "whisper" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          🎙 Groq Whisper (Audio)
        </button>
        <button
          type="button"
          onClick={() => setCaptureMode("live_speech")}
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            background: captureMode === "live_speech" ? "#fff" : "transparent",
            color: captureMode === "live_speech" ? "#1a365d" : "#64748b",
            boxShadow: captureMode === "live_speech" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          ⚡ Live Speech (Browser)
        </button>
      </div>

      {captureMode === "whisper" ? (
        /* MediaRecorder / Groq Whisper Mode */
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          {!isRecording ? (
            <button
              onClick={() => audioRecorder.startRecording()}
              disabled={audioRecorder.status === "requesting_permission"}
              style={btn({
                background: audioRecorder.status === "requesting_permission" ? "#94a3b8" : "#dc2626",
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
              aria-label="Start recording audio note"
            >
              {audioRecorder.status === "requesting_permission" ? "…" : "🎙"}
            </button>
          ) : (
            <button
              onClick={() => audioRecorder.stopRecording()}
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
              aria-label="Stop recording audio note"
            >
              ⏹
            </button>
          )}

          {/* Status Line */}
          <div style={{ marginTop: "0.75rem", fontSize: "0.95rem", color: "#64748b", minHeight: "1.5rem" }}>
            {audioRecorder.status === "requesting_permission" && "Requesting microphone permission…"}
            {isRecording && (
              <span>
                <span style={{ color: "#dc2626", fontWeight: 700 }}>● REC</span> {formatDuration(audioRecorder.durationSeconds)} (max 60s) — tap ⏹ to stop
              </span>
            )}
            {isStopped && hasAudio && `Audio recorded (${formatDuration(audioRecorder.durationSeconds)}). Ready to process.`}
            {audioRecorder.status === "idle" && "Tap 🎙 to record audio (Groq Whisper)"}
          </div>

          {/* Audio Process Button */}
          {hasAudio && (
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={() => handleProcess()}
                style={btn({ background: "#1a365d", color: "#fff", width: "100%" })}
              >
                ⚡ Process Audio with Groq Whisper
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Live Web Speech Mode (M4) */
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          {!speechRecorder.supportsWebSpeech && (
            <div style={{ ...card, background: "#fff8e6", border: "1px solid #ffd591", textAlign: "left" }}>
              <strong style={{ color: "#d46b08" }}>⚠️ Live Speech not supported in this browser.</strong>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", color: "#78350f" }}>
                Switch to <strong>Groq Whisper (Audio)</strong> above or type your transaction below.
              </p>
            </div>
          )}

          {speechRecorder.state !== "recording" ? (
            <button
              onClick={() => {
                speechRecorder.startRecording();
              }}
              disabled={speechRecorder.state === "requesting"}
              style={btn({
                background: speechRecorder.state === "requesting" ? "#94a3b8" : "#2563eb",
                color: "#fff",
                borderRadius: "50%",
                width: "100px",
                height: "100px",
                fontSize: "2.5rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
              })}
              aria-label="Start live speech recognition"
            >
              {speechRecorder.state === "requesting" ? "…" : "🎙"}
            </button>
          ) : (
            <button
              onClick={() => {
                speechRecorder.stopRecording();
                if (speechRecorder.transcript) {
                  setTypedText(speechRecorder.transcript);
                }
              }}
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
                boxShadow: "0 0 0 4px rgba(37,99,235,0.3)",
              })}
              aria-label="Stop live speech recognition"
            >
              ⏹
            </button>
          )}

          <div style={{ marginTop: "0.75rem", fontSize: "0.95rem", color: "#64748b", minHeight: "1.5rem" }}>
            {speechRecorder.state === "requesting" && "Requesting microphone…"}
            {speechRecorder.state === "recording" && (
              <span>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>● LISTENING</span> {formatDuration(speechRecorder.durationSeconds)} — tap ⏹ to stop
              </span>
            )}
            {speechRecorder.state === "done" && speechRecorder.transcript && `Transcribed: "${speechRecorder.transcript}"`}
            {speechRecorder.state === "idle" && speechRecorder.supportsWebSpeech && "Tap 🎙 to speak (Live Browser Speech)"}
          </div>

          {speechRecorder.interimTranscript && (
            <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "#f1f5f9", borderRadius: 6, color: "#64748b", fontStyle: "italic", fontSize: "0.95rem" }}>
              {speechRecorder.interimTranscript}…
            </div>
          )}

          {speechRecorder.transcript && (
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={() => handleProcess(null, speechRecorder.transcript)}
                style={btn({ background: "#2563eb", color: "#fff", width: "100%" })}
              >
                ⚡ Analyze Spoken Speech
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recording Error Notice */}
      {audioRecorder.errorMessage && (
        <div role="alert" style={{ ...card, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          <strong>⚠️ {audioRecorder.errorMessage}</strong>
        </div>
      )}

      {errorMessage && (
        <div role="alert" style={{ ...card, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          <strong>⚠️ {errorMessage}</strong>
        </div>
      )}

      <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "1.5rem 0" }} />

      {/* Typed Text Fallback */}
      <div>
        <label htmlFor="voice-typed-text" style={{ fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
          Or type your statement or question
        </label>
        <textarea
          id="voice-typed-text"
          rows={3}
          placeholder='e.g. "Spent 120 on petrol" or "How much money do I have left?"'
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1rem",
            borderRadius: 6,
            border: "2px solid #e2e8f0",
            boxSizing: "border-box",
            resize: "vertical",
          }}
        />
        <button
          onClick={() => handleProcess(null, typedText)}
          disabled={!hasText}
          style={btn({
            width: "100%",
            marginTop: "0.75rem",
            background: hasText ? "#1a365d" : "#cbd5e1",
            color: hasText ? "#fff" : "#94a3b8",
            cursor: hasText ? "pointer" : "not-allowed",
          })}
        >
          → Analyze Financial Intent
        </button>
      </div>

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
