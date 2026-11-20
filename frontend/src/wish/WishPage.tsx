// =====================================================================
// FLOVA WISH — Main View
// Design Direction: Minimalist fintech × editorial design × quiet premium
// Color System:
//   Warm ivory background: #F5F3ED
//   Charcoal text:         #252823
//   Muted forest green:    #536C53
//   Stone surface:         #E9E7DF
//   Muted secondary text:  #77776F
//   White:                 #FFFFFF
//   Subtle border:         #DDD9CE
// =====================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatINR } from "../lib/money";
import { parseOptionalRupees, parseRequiredRupees } from "../profile/parseRupees";
import type { ContributionCadence } from "./types";
import { useWish } from "./useWish";

// --- Minimal Clean SVG Icons (no emojis) ---
function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// --- Visual Tokens ---
const PALETTE = {
  bg: "#F5F3ED",
  card: "#FFFFFF",
  stone: "#E9E7DF",
  border: "#DDD9CE",
  text: "#252823",
  muted: "#77776F",
  green: "#536C53",
  greenLight: "#E8EDE8",
  greenDark: "#415441",
  subtleHover: "#EFECE3",
  dangerText: "#993B34",
  dangerBg: "#FAEEEC",
};

type ViewMode = "view" | "create" | "edit" | "add_savings" | "confirm_purchase" | "confirm_reset";

export function WishPage() {
  const navigate = useNavigate();
  const { wish, calc, loading, error, create, update, addSavings, markPurchased, remove } = useWish();

  const [mode, setMode] = useState<ViewMode>("view");

  // Form states (Create / Edit)
  const [formName, setFormName] = useState("");
  const [formTargetText, setFormTargetText] = useState("");
  const [formSavedText, setFormSavedText] = useState("");
  const [formContribText, setFormContribText] = useState("");
  const [formCadence, setFormCadence] = useState<ContributionCadence>("weekly");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formProductUrl, setFormProductUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Savings state
  const [savingsInputText, setSavingsInputText] = useState("");
  const [savingsError, setSavingsError] = useState<string | null>(null);

  // Switch to create mode
  function openCreate() {
    setFormName("");
    setFormTargetText("");
    setFormSavedText("");
    setFormContribText("");
    setFormCadence("weekly");
    setFormImageUrl("");
    setFormProductUrl("");
    setFormError(null);
    setMode("create");
  }

  // Switch to edit mode
  function openEdit() {
    if (!wish) return;
    setFormName(wish.name);
    setFormTargetText(wish.targetPaise > 0 ? (wish.targetPaise / 100).toString() : "");
    setFormSavedText(wish.savedPaise > 0 ? (wish.savedPaise / 100).toString() : "");
    setFormContribText(wish.contributionPaise > 0 ? (wish.contributionPaise / 100).toString() : "");
    setFormCadence(wish.cadence || "weekly");
    setFormImageUrl(wish.imageUrl || "");
    setFormProductUrl(wish.productUrl || "");
    setFormError(null);
    setMode("edit");
  }

  // Handle Create Submit
  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const name = formName.trim();
    if (!name) {
      setFormError("Please enter what you are saving for.");
      return;
    }

    const targetRes = parseRequiredRupees(formTargetText);
    if (!targetRes.ok) {
      setFormError(`Target price: ${targetRes.message}`);
      return;
    }

    const savedRes = parseOptionalRupees(formSavedText || "0");
    if (!savedRes.ok) {
      setFormError(`Already saved: ${savedRes.message}`);
      return;
    }

    const contribRes = parseOptionalRupees(formContribText || "0");
    if (!contribRes.ok) {
      setFormError(`Regular contribution: ${contribRes.message}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await create({
        name,
        targetPaise: targetRes.paise,
        initialSavedPaise: savedRes.paise || 0,
        contributionPaise: contribRes.paise || 0,
        cadence: formCadence,
        imageUrl: formImageUrl.trim() || null,
        productUrl: formProductUrl.trim() || null,
      });
      setMode("view");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create wish.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Edit Submit
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const name = formName.trim();
    if (!name) {
      setFormError("Please enter what you are saving for.");
      return;
    }

    const targetRes = parseRequiredRupees(formTargetText);
    if (!targetRes.ok) {
      setFormError(`Target price: ${targetRes.message}`);
      return;
    }

    const savedRes = parseOptionalRupees(formSavedText || "0");
    if (!savedRes.ok) {
      setFormError(`Amount saved: ${savedRes.message}`);
      return;
    }

    const contribRes = parseOptionalRupees(formContribText || "0");
    if (!contribRes.ok) {
      setFormError(`Contribution: ${contribRes.message}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await update({
        name,
        targetPaise: targetRes.paise,
        savedPaise: savedRes.paise || 0,
        contributionPaise: contribRes.paise || 0,
        cadence: formCadence,
        imageUrl: formImageUrl.trim() || null,
        productUrl: formProductUrl.trim() || null,
      });
      setMode("view");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not update wish.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Quick Add Savings
  async function handleAddSavingsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingsError(null);

    const res = parseRequiredRupees(savingsInputText);
    if (!res.ok) {
      setSavingsError(res.message);
      return;
    }

    setIsSubmitting(true);
    try {
      await addSavings(res.paise);
      setSavingsInputText("");
      setMode("view");
    } catch (err) {
      setSavingsError(err instanceof Error ? err.message : "Could not record savings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Quick preset helper
  function applyPresetSavings(amountRupees: number) {
    setSavingsInputText(amountRupees.toString());
  }

  // Handle Mark Purchased
  async function handleConfirmPurchase() {
    setIsSubmitting(true);
    try {
      await markPurchased();
      setMode("view");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to record purchase");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Reset / Delete
  async function handleConfirmReset() {
    setIsSubmitting(true);
    try {
      await remove();
      setMode("view");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to reset wish");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: PALETTE.bg,
        color: PALETTE.text,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "24px 16px 64px",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Editorial Top Navigation */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
            paddingBottom: "16px",
            borderBottom: `1px solid ${PALETTE.border}`,
          }}
        >
          <button
            onClick={() => {
              if (mode !== "view") {
                setMode("view");
              } else {
                navigate("/");
              }
            }}
            style={{
              background: "none",
              border: "none",
              color: PALETTE.muted,
              cursor: "pointer",
              padding: "8px 0",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 500,
            }}
            aria-label="Back"
          >
            <ArrowLeftIcon />
            <span>{mode === "view" ? "FLOVA Overview" : "Back to Wish"}</span>
          </button>

          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: PALETTE.green,
            }}
          >
            WISH · Savings Goal
          </div>
        </header>

        {/* Global Error Banner if any */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: PALETTE.dangerBg,
              color: PALETTE.dangerText,
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "20px",
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !wish && (
          <div style={{ padding: "48px 0", textAlign: "center", color: PALETTE.muted }}>
            <p style={{ fontSize: "14px" }}>Loading your savings plan…</p>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW A: EMPTY STATE                                           */}
        {/* ------------------------------------------------------------- */}
        {!loading && !wish && mode === "view" && (
          <div
            style={{
              padding: "64px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "inline-block",
                width: "48px",
                height: "1px",
                backgroundColor: PALETTE.green,
                marginBottom: "24px",
              }}
            />
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: PALETTE.text,
                margin: "0 0 12px",
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              Something worth saving for.
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: PALETTE.muted,
                maxWidth: "360px",
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              Keep your goals close. Make them happen at your own pace without straining your daily essentials.
            </p>

            <button
              onClick={openCreate}
              style={{
                backgroundColor: PALETTE.green,
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "14px 28px",
                fontSize: "15px",
                fontWeight: 500,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(37,40,35,0.08)",
                transition: "background-color 0.15s ease",
              }}
            >
              Create your wish
            </button>

            <div style={{ marginTop: "24px" }}>
              <button
                type="button"
                onClick={() => {
                  setFormName("Delivery Helmet");
                  setFormTargetText("3500");
                  setFormSavedText("1000");
                  setFormContribText("500");
                  setFormCadence("weekly");
                  setFormImageUrl("");
                  setFormProductUrl("");
                  setFormError(null);
                  setMode("create");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: PALETTE.muted,
                  fontSize: "13px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: "4px 8px",
                }}
              >
                Or try example: Delivery Helmet (₹3,500) →
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW B: CREATE WISH                                           */}
        {/* ------------------------------------------------------------- */}
        {mode === "create" && (
          <div>
            <div style={{ marginBottom: "28px" }}>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  margin: "0 0 6px",
                  letterSpacing: "-0.01em",
                }}
              >
                Create your wish
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: PALETTE.muted }}>
                Choose a clear target and a sustainable pace.
              </p>
            </div>

            {formError && (
              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: PALETTE.dangerBg,
                  color: PALETTE.dangerText,
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginBottom: "20px",
                  border: `1px solid ${PALETTE.border}`,
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              {/* Field 1: Name */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="wish-name"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: "6px",
                  }}
                >
                  What do you want to save for?
                </label>
                <input
                  id="wish-name"
                  type="text"
                  placeholder="e.g. New Delivery Helmet, Phone Upgrade, Festive Gift"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    borderRadius: "8px",
                    border: `1px solid ${PALETTE.border}`,
                    backgroundColor: PALETTE.card,
                    color: PALETTE.text,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Field 2: Target Price */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="wish-target"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: "6px",
                  }}
                >
                  Target price (₹)
                </label>
                <input
                  id="wish-target"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 8500"
                  value={formTargetText}
                  onChange={(e) => setFormTargetText(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    fontVariantNumeric: "tabular-nums",
                    borderRadius: "8px",
                    border: `1px solid ${PALETTE.border}`,
                    backgroundColor: PALETTE.card,
                    color: PALETTE.text,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Field 3: Already Saved (Optional) */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="wish-saved"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: "6px",
                  }}
                >
                  Already set aside toward this (₹, optional)
                </label>
                <input
                  id="wish-saved"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={formSavedText}
                  onChange={(e) => setFormSavedText(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    fontVariantNumeric: "tabular-nums",
                    borderRadius: "8px",
                    border: `1px solid ${PALETTE.border}`,
                    backgroundColor: PALETTE.card,
                    color: PALETTE.text,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Field 4: Contribution & Cadence */}
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: "6px",
                  }}
                >
                  How much can you comfortably set aside?
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 500"
                    value={formContribText}
                    onChange={(e) => setFormContribText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      fontSize: "15px",
                      fontVariantNumeric: "tabular-nums",
                      borderRadius: "8px",
                      border: `1px solid ${PALETTE.border}`,
                      backgroundColor: PALETTE.card,
                      color: PALETTE.text,
                      boxSizing: "border-box",
                    }}
                  />
                  <select
                    value={formCadence}
                    onChange={(e) => setFormCadence(e.target.value as ContributionCadence)}
                    style={{
                      width: "140px",
                      padding: "12px 14px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      border: `1px solid ${PALETTE.border}`,
                      backgroundColor: PALETTE.card,
                      color: PALETTE.text,
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    <option value="weekly">Every week</option>
                    <option value="monthly">Every month</option>
                  </select>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: PALETTE.muted }}>
                  This rhythm calculates a calm, realistic timeline. You can adjust it anytime.
                </p>
              </div>

              {/* Optional Fields: URL / Image */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: PALETTE.stone,
                  borderRadius: "8px",
                  marginBottom: "28px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: PALETTE.muted,
                    marginBottom: "12px",
                  }}
                >
                  Optional Details
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <input
                    type="url"
                    placeholder="Product URL (e.g. Amazon, Flipkart)"
                    value={formProductUrl}
                    onChange={(e) => setFormProductUrl(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: `1px solid ${PALETTE.border}`,
                      backgroundColor: PALETTE.card,
                      color: PALETTE.text,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <input
                    type="url"
                    placeholder="Image URL (direct image link)"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      borderRadius: "6px",
                      border: `1px solid ${PALETTE.border}`,
                      backgroundColor: PALETTE.card,
                      color: PALETTE.text,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    backgroundColor: PALETTE.green,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "14px",
                    fontSize: "15px",
                    fontWeight: 500,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 2px rgba(37,40,35,0.06)",
                  }}
                >
                  {isSubmitting ? "Saving…" : "Start Saving for Wish"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: "transparent",
                    color: PALETTE.muted,
                    border: `1px solid ${PALETTE.border}`,
                    borderRadius: "8px",
                    padding: "14px 20px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW C: EDIT WISH                                             */}
        {/* ------------------------------------------------------------- */}
        {mode === "edit" && wish && (
          <div>
            <div style={{ marginBottom: "28px" }}>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  margin: "0 0 6px",
                  letterSpacing: "-0.01em",
                }}
              >
                Edit Wish & Plan
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: PALETTE.muted }}>
                Refine your target, contribution amount, or details.
              </p>
            </div>

            {formError && (
              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: PALETTE.dangerBg,
                  color: PALETTE.dangerText,
                  borderRadius: "8px",
                  fontSize: "14px",
                  marginBottom: "20px",
                  border: `1px solid ${PALETTE.border}`,
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="edit-wish-name"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: "6px",
                  }}
                >
                  Wish name
                </label>
                <input
                  id="edit-wish-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    borderRadius: "8px",
                    border: `1px solid ${PALETTE.border}`,
                    backgroundColor: PALETTE.card,
                    color: PALETTE.text,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label
                    htmlFor="edit-wish-target"
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: PALETTE.text,
                      marginBottom: "6px",
                    }}
                  >
                    Target price (₹)
                  </label>
                  <input
                    id="edit-wish-target"
                    type="text"
                    inputMode="decimal"
                    value={formTargetText}
                    onChange={(e) => setFormTargetText(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: "15px",
                      fontVariantNumeric: "tabular-nums",
                      borderRadius: "8px",
                      border: `1px solid ${PALETTE.border}`,
                      backgroundColor: PALETTE.card,
                      color: PALETTE.text,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-wish-saved"
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: PALETTE.text,
                      marginBottom: "6px",
                    }}
                  >
                    Current saved (₹)
                  </label>
                  <input
                    id="edit-wish-saved"
                    type="text"
                    inputMode="decimal"
                    value={formSavedText}
                    onChange={(e) => setFormSavedText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: "15px",
                      fontVariantNumeric: "tabular-nums",
                      borderRadius: "8px",
                      border: `1px solid ${PALETTE.border}`,
                      backgroundColor: PALETTE.card,
                      color: PALETTE.text,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: "6px",
                  }}
                >
                  Regular contribution
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formContribText}
                    onChange={(e) => setFormContribText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      fontSize: "15px",
                      fontVariantNumeric: "tabular-nums",
                      borderRadius: "8px",
                      border: `1px solid ${PALETTE.border}`,
                      backgroundColor: PALETTE.card,
                      color: PALETTE.text,
                      boxSizing: "border-box",
                    }}
                  />
                  <select
                    value={formCadence}
                    onChange={(e) => setFormCadence(e.target.value as ContributionCadence)}
                    style={{
                      width: "140px",
                      padding: "12px 14px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      border: `1px solid ${PALETTE.border}`,
                      backgroundColor: PALETTE.card,
                      color: PALETTE.text,
                      boxSizing: "border-box",
                      cursor: "pointer",
                    }}
                  >
                    <option value="weekly">Every week</option>
                    <option value="monthly">Every month</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "28px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: "6px",
                  }}
                >
                  Product link (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://…"
                  value={formProductUrl}
                  onChange={(e) => setFormProductUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "14px",
                    borderRadius: "8px",
                    border: `1px solid ${PALETTE.border}`,
                    backgroundColor: PALETTE.card,
                    color: PALETTE.text,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    backgroundColor: PALETTE.green,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "14px",
                    fontSize: "15px",
                    fontWeight: 500,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  style={{
                    backgroundColor: "transparent",
                    color: PALETTE.muted,
                    border: `1px solid ${PALETTE.border}`,
                    borderRadius: "8px",
                    padding: "14px 20px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW D: ACTIVE WISH DISPLAY                                   */}
        {/* ------------------------------------------------------------- */}
        {!loading && wish && calc && mode === "view" && (
          <div>
            {/* Completed Banner if achieved */}
            {calc.isCompleted && (
              <div
                style={{
                  padding: "16px 20px",
                  backgroundColor: PALETTE.greenLight,
                  borderRadius: "10px",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: `1px solid ${PALETTE.green}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: PALETTE.greenDark, fontSize: "15px" }}>
                    Goal reached.
                  </div>
                  <div style={{ fontSize: "13px", color: PALETTE.greenDark, marginTop: "2px" }}>
                    You have saved the full {formatINR(wish.targetPaise)} for this wish.
                  </div>
                </div>
                {wish.status !== "completed" && (
                  <button
                    onClick={() => setMode("confirm_purchase")}
                    style={{
                      backgroundColor: PALETTE.green,
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 14px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Mark Purchased
                  </button>
                )}
              </div>
            )}

            {/* Editorial Focus Card */}
            <div
              style={{
                backgroundColor: PALETTE.card,
                borderRadius: "12px",
                border: `1px solid ${PALETTE.border}`,
                padding: "28px 24px",
                marginBottom: "24px",
                boxShadow: "0 1px 3px rgba(37,40,35,0.03)",
              }}
            >
              {/* Top Row: Title & Optional External Link */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: PALETTE.muted,
                      marginBottom: "6px",
                    }}
                  >
                    Target Wish
                  </div>
                  <h1
                    style={{
                      fontSize: "26px",
                      fontWeight: 600,
                      color: PALETTE.text,
                      margin: 0,
                      lineHeight: 1.25,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {wish.name}
                  </h1>
                </div>

                {wish.productUrl && (
                  <a
                    href={wish.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "13px",
                      color: PALETTE.green,
                      textDecoration: "none",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      backgroundColor: PALETTE.stone,
                      fontWeight: 500,
                    }}
                  >
                    <span>View item</span>
                    <ExternalLinkIcon />
                  </a>
                )}
              </div>

              {/* Optional Photo Container */}
              {wish.imageUrl && (
                <div
                  style={{
                    marginBottom: "24px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: `1px solid ${PALETTE.border}`,
                    maxHeight: "220px",
                    backgroundColor: PALETTE.stone,
                  }}
                >
                  <img
                    src={wish.imageUrl}
                    alt={wish.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      maxHeight: "220px",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Progress Section */}
              <div style={{ marginBottom: "28px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "32px",
                      fontWeight: 600,
                      color: PALETTE.text,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {formatINR(wish.savedPaise)}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      color: PALETTE.muted,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    of {formatINR(wish.targetPaise)} ({calc.progressPercent}%)
                  </span>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "10px",
                    backgroundColor: PALETTE.stone,
                    borderRadius: "999px",
                    overflow: "hidden",
                    border: `1px solid ${PALETTE.border}`,
                    padding: "1px",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: `${calc.progressPercent}%`,
                      height: "100%",
                      backgroundColor: PALETTE.green,
                      transition: "width 0.4s ease",
                      borderRadius: "999px",
                    }}
                  />
                </div>
              </div>

              {/* Financial Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  paddingTop: "20px",
                  borderTop: `1px solid ${PALETTE.stone}`,
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: PALETTE.muted, marginBottom: "4px" }}>
                    Remaining to save
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: calc.remainingPaise > 0 ? PALETTE.text : PALETTE.green,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatINR(calc.remainingPaise)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "12px", color: PALETTE.muted, marginBottom: "4px" }}>
                    Current pace
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                      color: PALETTE.text,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {wish.contributionPaise > 0
                      ? `${formatINR(wish.contributionPaise)} / ${wish.cadence === "weekly" ? "wk" : "mo"}`
                      : "No pace set"}
                  </div>
                </div>
              </div>

              {/* Timeline Note */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "10px 14px",
                  backgroundColor: PALETTE.stone,
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: PALETTE.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{calc.timelineSummary}</span>
                {wish.contributionPaise === 0 && (
                  <button
                    onClick={openEdit}
                    style={{
                      background: "none",
                      border: "none",
                      color: PALETTE.green,
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Set rhythm →
                  </button>
                )}
              </div>
            </div>

            {/* Quick Action Bar */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "32px", flexWrap: "wrap" }}>
              <button
                onClick={() => setMode("add_savings")}
                style={{
                  flex: "1 1 180px",
                  backgroundColor: PALETTE.green,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px 18px",
                  fontSize: "15px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 1px 2px rgba(37,40,35,0.06)",
                }}
              >
                <PlusIcon />
                <span>Put money aside</span>
              </button>

              <button
                onClick={openEdit}
                style={{
                  flex: "1 1 120px",
                  backgroundColor: PALETTE.card,
                  color: PALETTE.text,
                  border: `1px solid ${PALETTE.border}`,
                  borderRadius: "8px",
                  padding: "14px 18px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Edit Plan
              </button>

              {wish.status !== "completed" && (
                <button
                  onClick={() => setMode("confirm_purchase")}
                  style={{
                    backgroundColor: "transparent",
                    color: PALETTE.muted,
                    border: `1px solid ${PALETTE.border}`,
                    borderRadius: "8px",
                    padding: "14px 16px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                  title="Mark as purchased"
                >
                  <CheckIcon />
                </button>
              )}
            </div>

            {/* Danger / Reset Section */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "16px",
                borderTop: `1px solid ${PALETTE.border}`,
              }}
            >
              <span style={{ fontSize: "13px", color: PALETTE.muted }}>
                Need to change or close this goal?
              </span>
              <button
                onClick={() => setMode("confirm_reset")}
                style={{
                  background: "none",
                  border: "none",
                  color: PALETTE.dangerText,
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "4px 8px",
                }}
              >
                Reset wish
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW E: ADD SAVINGS TRAY / FORM                               */}
        {/* ------------------------------------------------------------- */}
        {mode === "add_savings" && wish && (
          <div
            style={{
              backgroundColor: PALETTE.card,
              borderRadius: "12px",
              border: `1px solid ${PALETTE.border}`,
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: PALETTE.muted,
                  marginBottom: "4px",
                }}
              >
                Add to your savings
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>
                {wish.name}
              </h2>
            </div>

            {savingsError && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: PALETTE.dangerBg,
                  color: PALETTE.dangerText,
                  borderRadius: "6px",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {savingsError}
              </div>
            )}

            {/* Quick Presets */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: PALETTE.muted, marginBottom: "8px" }}>
                Quick amounts
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[200, 500, 1000, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyPresetSavings(preset)}
                    style={{
                      backgroundColor: PALETTE.stone,
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 14px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: PALETTE.text,
                      cursor: "pointer",
                    }}
                  >
                    +₹{preset}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddSavingsSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="savings-amount"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: "6px",
                  }}
                >
                  Amount to put aside (₹)
                </label>
                <input
                  id="savings-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 500"
                  value={savingsInputText}
                  onChange={(e) => setSavingsInputText(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "16px",
                    fontVariantNumeric: "tabular-nums",
                    borderRadius: "8px",
                    border: `1px solid ${PALETTE.border}`,
                    backgroundColor: PALETTE.bg,
                    color: PALETTE.text,
                    boxSizing: "border-box",
                  }}
                />
                {(() => {
                  const parsed = parseOptionalRupees(savingsInputText);
                  if (parsed.ok && parsed.paise && parsed.paise > 0) {
                    const nextSaved = wish.savedPaise + parsed.paise;
                    const nextRemaining = Math.max(0, wish.targetPaise - nextSaved);
                    const nextPercent = Math.min(100, Math.round((nextSaved / wish.targetPaise) * 100));
                    return (
                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "13px",
                          color: PALETTE.green,
                          fontWeight: 500,
                        }}
                      >
                        After this: {formatINR(nextSaved)} saved ({nextPercent}%), {formatINR(nextRemaining)} remaining.
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    backgroundColor: PALETTE.green,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "15px",
                    fontWeight: 500,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Recording…" : "Record Savings"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavingsInputText("");
                    setMode("view");
                  }}
                  style={{
                    backgroundColor: "transparent",
                    color: PALETTE.muted,
                    border: `1px solid ${PALETTE.border}`,
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW F: CONFIRM PURCHASE                                      */}
        {/* ------------------------------------------------------------- */}
        {mode === "confirm_purchase" && wish && (
          <div
            style={{
              backgroundColor: PALETTE.card,
              borderRadius: "12px",
              border: `1px solid ${PALETTE.border}`,
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 8px" }}>
              Mark as Purchased
            </h2>
            <p style={{ fontSize: "14px", color: PALETTE.muted, margin: "0 0 24px", lineHeight: 1.5 }}>
              Have you purchased <strong>{wish.name}</strong>? Marking it as purchased celebrates your achievement and completes this savings cycle.
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleConfirmPurchase}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  backgroundColor: PALETTE.green,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "15px",
                  fontWeight: 500,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Updating…" : "Yes, I bought it"}
              </button>
              <button
                onClick={() => setMode("view")}
                style={{
                  backgroundColor: "transparent",
                  color: PALETTE.muted,
                  border: `1px solid ${PALETTE.border}`,
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Keep Saving
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW G: CONFIRM RESET                                         */}
        {/* ------------------------------------------------------------- */}
        {mode === "confirm_reset" && wish && (
          <div
            style={{
              backgroundColor: PALETTE.card,
              borderRadius: "12px",
              border: `1px solid ${PALETTE.border}`,
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: PALETTE.dangerText, margin: "0 0 8px" }}>
              Close or Reset Wish
            </h2>
            <p style={{ fontSize: "14px", color: PALETTE.muted, margin: "0 0 24px", lineHeight: 1.5 }}>
              Are you sure you want to close <strong>{wish.name}</strong>? This will remove your active savings goal so you can start a fresh one.
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleConfirmReset}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  backgroundColor: PALETTE.dangerText,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "15px",
                  fontWeight: 500,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Resetting…" : "Reset Goal"}
              </button>
              <button
                onClick={() => setMode("view")}
                style={{
                  backgroundColor: "transparent",
                  color: PALETTE.muted,
                  border: `1px solid ${PALETTE.border}`,
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
