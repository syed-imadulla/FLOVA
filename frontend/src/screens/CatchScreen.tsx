// =====================================================================
// Scan a Receipt or UPI Payment Screenshot (FLOVA Catch)
// Supports camera capture, phone gallery uploads, desktop image drop,
// PWA Web Share Target integration, and payment SMS / text pasting.
// Strictly read-only AI inference; confirmed only on /add.
// =====================================================================

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paiseToInput } from "../app/moneyText";
import type { ReviewState } from "./AddScreen";
import { todayLocalISO } from "../data/dates";
import { extractReceipt } from "../services/receipt";
import { Button, Card, Notice, Screen, Segmented } from "../ui/kit";
import { IconCamera, IconImage, IconSparkle, IconTrash } from "../ui/icons";

export function CatchScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"photo" | "text">("photo");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  // Revoke object URL on preview change/unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Handle incoming PWA Web Share Target content on mount
  useEffect(() => {
    async function loadSharedContent() {
      const isShared = searchParams.get("shared") === "1";
      const sharedTextParam = searchParams.get("text") || searchParams.get("url");

      if (sharedTextParam) {
        setMode("text");
        setText(sharedTextParam);
        setShareNotice("Payment information received from shared app.");
        return;
      }

      if (isShared && typeof window !== "undefined" && "caches" in window) {
        try {
          const cache = await caches.open("flova-shared-cache");

          // 1. Check for shared file
          const fileRes = await cache.match("/shared-file");
          if (fileRes) {
            const blob = await fileRes.blob();
            const fileName = fileRes.headers.get("X-File-Name") || "shared-payment.jpg";
            const sharedFile = new File([blob], fileName, { type: blob.type || "image/jpeg" });
            pick(sharedFile);
            setShareNotice("Payment screenshot / receipt received from shared app.");
            await cache.delete("/shared-file");
          }

          // 2. Check for shared text
          const textRes = await cache.match("/shared-text");
          if (textRes) {
            const json = await textRes.json();
            if (json?.text) {
              setMode("text");
              setText(json.text);
              setShareNotice("Payment message received from shared app.");
              await cache.delete("/shared-text");
            }
          }
        } catch (err) {
          console.warn("Could not retrieve shared content from cache:", err);
        }
      }
    }

    void loadSharedContent();
  }, [searchParams]);

  function pick(f: File | null) {
    setError(null);
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
  }

  async function extract() {
    setBusy(true);
    setError(null);
    try {
      const c = await extractReceipt(mode === "photo" ? { file: file ?? undefined } : { text: text.trim() });
      const missing = [
        c.amountPaise == null && c.amount_paise == null ? "amount" : null,
        !c.expenseType && !c.expense_type ? "living or work" : null,
      ].filter(Boolean);

      const isUpi = c.kind === "upi_screenshot" || Boolean(c.upiReference) || Boolean(c.upiApp);
      const origin: ReviewState["origin"] = isUpi ? "upi_screenshot" : "receipt";

      let aiNote = `Extracted from ${isUpi ? "UPI payment screenshot" : "receipt"}${c.merchant ? ` (${c.merchant})` : ""}.`;
      if (c.dateFallback) {
        aiNote += ` Date not visible on receipt; using today (${c.date}).`;
      }
      if (c.paymentStatus === "pending") {
        aiNote += " ⚠️ Payment is currently pending settlement.";
      } else if (c.paymentStatus === "failed") {
        aiNote += " ⚠️ Payment is marked as failed/declined.";
      }
      if (missing.length > 0) {
        aiNote += ` Please fill in: ${missing.join(", ")}.`;
      } else {
        aiNote += " Check the details below.";
      }

      const state: ReviewState = {
        origin,
        candidateId: c.id || c.candidate_id,
        merchant: c.merchant,
        aiNote,
        paymentStatus: c.paymentStatus,
        upiReference: c.upiReference,
        upiApp: c.upiApp,
        dateFallback: c.dateFallback,
        extractedDate: c.extractedDate,
        scannedAt: c.scannedAt,
        duplicateWarning: c.duplicateWarning
          ? typeof c.duplicateWarning === "string"
            ? c.duplicateWarning
            : `Existing transaction has the same UPI reference: ${c.duplicateWarning.reference}`
          : null,
        items: c.items,
        possibleTotals: c.possibleTotals,
        draft: {
          type: "expense",
          amount: paiseToInput(c.amountPaise ?? c.amount_paise ?? null),
          category: c.category || "",
          expenseType: (c.expenseType ?? c.expense_type ?? "") || "",
          ownership: "mine",
          date: c.date || todayLocalISO(),
          note: c.description || c.notes || c.merchant || (c.upiReference ? `UPI Ref: ${c.upiReference}` : ""),
        },
      };

      navigate("/add", { state });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        /failed to send|not found|fetch|502|503/i.test(msg)
          ? "The FLOVA extraction service is temporarily unreachable. You can enter details manually instead."
          : msg || "Couldn't read the image or text. Please try again or enter manually."
      );
    } finally {
      setBusy(false);
    }
  }

  const ready = mode === "photo" ? !!file : text.trim().length > 0;

  return (
    <Screen title="Smart Capture" subtitle="Receipts, UPI screenshots & payment messages" back>
      {shareNotice ? (
        <Notice tone="info" title="Shared content loaded">
          {shareNotice}
        </Notice>
      ) : null}

      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "photo", label: "Receipt / UPI Screenshot" },
          { value: "text", label: "Paste Text / SMS" },
        ]}
      />

      {mode === "photo" ? (
        <Card className="p-4 space-y-3">
          {/* Hidden file inputs: one for Camera, one for Gallery */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />

          {preview ? (
            <div className="space-y-3">
              <div className="relative w-full aspect-[4/3] rounded-2xl border border-line bg-[#FAFBF8] overflow-hidden flex items-center justify-center">
                <img src={preview} alt="Selected receipt or screenshot" className="w-full h-full object-contain" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  icon={<IconCamera size={18} />}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Retake photo
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  icon={<IconImage size={18} />}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  Change from gallery
                </Button>
                <button
                  type="button"
                  onClick={clearImage}
                  className="p-3 rounded-xl border border-line bg-white text-ink-muted hover:text-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <IconTrash size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-line bg-[#FAFBF8] flex flex-col items-center justify-center p-6 text-center">
                <span className="w-14 h-14 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center mb-2">
                  <IconCamera size={26} />
                </span>
                <span className="text-[16px] font-bold text-ink">Upload Bill or Payment Screenshot</span>
                <span className="text-xs text-ink-muted mt-1 max-w-[260px]">
                  Supports fuel slips, grocery bills, and screenshots from Google Pay, PhonePe, Paytm, CRED & BHIM.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="primary"
                  icon={<IconCamera size={18} />}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Take photo
                </Button>
                <Button
                  variant="secondary"
                  icon={<IconImage size={18} />}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  Choose from gallery
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-4 space-y-2">
          <label htmlFor="receipt-text" className="block text-[13px] font-semibold text-ink-soft">
            Paste payment SMS, UPI notification, or bill text
          </label>
          <textarea
            id="receipt-text"
            rows={5}
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Paid Rs.450.00 to Sharma Kirana on 21-11-2026 via UPI. Ref: 432198765432. Status: Successful."
            className="w-full rounded-xl border border-line bg-white p-3.5 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 resize-none"
          />
        </Card>
      )}

      {error ? <Notice tone="danger" title="Extraction Error">{error}</Notice> : null}

      <Button onClick={extract} loading={busy} disabled={!ready} icon={<IconSparkle size={18} />}>
        {busy ? "Reading document…" : "Extract details"}
      </Button>

      <Button variant="ghost" onClick={() => navigate("/add")}>
        Enter manually instead
      </Button>
    </Screen>
  );
}
