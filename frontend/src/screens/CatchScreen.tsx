// =====================================================================
// Scan a Receipt or UPI Payment Screenshot (FLOVA Catch - Phase 16 Repair)
// Supports camera capture, phone gallery uploads (up to 20 MB), desktop
// image drop, PWA Web Share Target, and payment SMS / text pasting.
// Features multi-step progress, client downscaling, and resilient retries.
// Strictly read-only AI inference; confirmed only on /add.
// =====================================================================

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paiseToInput } from "../app/moneyText";
import type { ReviewState } from "./AddScreen";
import { todayLocalISO } from "../data/dates";
import { extractReceipt, type ExtractionStage } from "../services/receipt";
import { claimAndResolveShare, renewShareLease, acknowledgeShare } from "../native/sharePlugin";
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
  const [stage, setStage] = useState<ExtractionStage | "idle">("idle");
  const [stagePercent, setStagePercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  // Revoke object URL on preview change/unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Handle incoming native shared content & PWA Web Share Target on mount
  useEffect(() => {
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    async function loadSharedContent() {
      // 1. Native Android Share Target via one-time sharedToken
      const sharedToken = searchParams.get("sharedToken");
      if (sharedToken) {
        // Strip sharedToken from URL immediately to prevent duplicate extraction on re-render
        navigate("/catch", { replace: true });

        // Retrieve existing claimId from sessionStorage if available
        let savedClaimId: string | undefined;
        try {
          const sess = sessionStorage.getItem("flova_active_share");
          if (sess) {
            const parsed = JSON.parse(sess);
            if (parsed.token === sharedToken) {
              savedClaimId = parsed.claimId;
            }
          }
        } catch {
          /* ignore storage issues */
        }

        const shared = await claimAndResolveShare(sharedToken, savedClaimId);
        if (shared) {
          // Persist active claim in sessionStorage for recovery
          try {
            sessionStorage.setItem("flova_active_share", JSON.stringify({ token: sharedToken, claimId: shared.claimId }));
          } catch {
            /* ignore */
          }

          // Start 20s heartbeat lease renewal
          heartbeatTimer = setInterval(() => {
            void renewShareLease(sharedToken, shared.claimId);
          }, 20000);

          if (shared.type === "text" && shared.text) {
            setMode("text");
            setText(shared.text);
            setShareNotice("Payment information received from UPI app.");
            await acknowledgeShare(sharedToken, shared.claimId);
            try { sessionStorage.removeItem("flova_active_share"); } catch { /* ignore */ }
            if (heartbeatTimer) clearInterval(heartbeatTimer);
          } else if (shared.type === "image" && shared.imageUrl) {
            try {
              // Fetch local asset into File object
              const response = await fetch(shared.imageUrl);
              const blob = await response.blob();
              const sharedFile = new File([blob], "shared-upi-receipt.jpg", { type: blob.type || "image/jpeg" });
              pick(sharedFile);
              setShareNotice("Payment receipt received from UPI app.");
              // Acknowledge consumption once loaded into memory
              await acknowledgeShare(sharedToken, shared.claimId);
              try { sessionStorage.removeItem("flova_active_share"); } catch { /* ignore */ }
              if (heartbeatTimer) clearInterval(heartbeatTimer);
            } catch (fetchErr) {
              console.error("Failed to fetch shared image from converted URL:", fetchErr);
              setError("Failed to load shared image. Please try sharing again.");
            }
          }
        }
        return;
      }

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

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    };
  }, [searchParams, navigate]);

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
    setStage("idle");
    setStagePercent(0);
  }

  async function extract() {
    setBusy(true);
    setError(null);
    setStage("preparing");
    setStagePercent(10);

    try {
      const c = await extractReceipt({
        file: mode === "photo" ? file ?? undefined : undefined,
        text: mode === "text" ? text.trim() : undefined,
        onProgress: (currentStage, percent) => {
          setStage(currentStage);
          if (percent !== undefined) setStagePercent(percent);
        },
      });

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
        subtotalPaise: c.subtotalPaise,
        taxPaise: c.taxPaise,
        discountPaise: c.discountPaise,
        arithmeticDiscrepancy: c.arithmeticDiscrepancy,
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
        /failed to send|not found|502|503/i.test(msg)
          ? "The FLOVA extraction engine is temporarily busy. You can retry or enter details manually."
          : msg || "Could not read the document. Please try again or enter details manually."
      );
    } finally {
      setBusy(false);
      setStage("idle");
    }
  }

  const ready = mode === "photo" ? !!file : text.trim().length > 0;

  function getStageDescription(): string {
    switch (stage) {
      case "preparing":
        return "1/3 Preparing & optimizing image resolution...";
      case "analysing":
        return "2/3 Analysing receipt & amounts with AI vision...";
      case "validating":
        return "3/3 Validating line items & arithmetic integrity...";
      case "ready":
        return "Ready! Opening transaction review...";
      default:
        return "Reading document…";
    }
  }

  return (
    <Screen title="Smart Capture" subtitle="Receipts, UPI screenshots & payment messages" back>
      {shareNotice ? (
        <Notice tone="info" title="Shared content loaded">
          {shareNotice}
        </Notice>
      ) : null}

      <Segmented
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
        options={[
          { value: "photo", label: "Receipt / Photo" },
          { value: "text", label: "Paste text / SMS" },
        ]}
      />

      {mode === "photo" ? (
        <Card className="p-4 space-y-3">
          <input
            ref={cameraInputRef}
            type="file"
            // Must be exactly "image/*": the Android app (Capacitor WebView) only opens the camera
            // when accept contains "image/*"; a list of specific types falls back to the gallery.
            // imageOptimizer still rejects unsupported formats.
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />

          {preview ? (
            <div className="space-y-3">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 border border-line">
                <img src={preview} alt="Receipt preview" className="w-full h-full object-contain" />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 text-xs"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Retake photo
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 text-xs"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  Change image
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
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) pick(e.dataTransfer.files[0]);
                }}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-line bg-[#FAFBF8] flex flex-col items-center justify-center p-6 text-center"
              >
                <span className="w-14 h-14 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center mb-2">
                  <IconCamera size={26} />
                </span>
                <span className="text-[16px] font-bold text-ink">Upload Bill or Payment Screenshot</span>
                <span className="text-xs text-ink-muted mt-1 max-w-[280px]">
                  Supports printed receipts, fuel slips, and standard UPI payment confirmation screenshots (e.g., Google Pay, PhonePe, Paytm, CRED, BHIM) up to 20 MB.
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
                  Choose gallery
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

      {busy && (
        <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900 text-xs flex items-center gap-3">
          <span className="animate-spin text-base">⏳</span>
          <div className="flex-1">
            <p className="font-semibold">{getStageDescription()}</p>
            <div className="w-full bg-brand-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${stagePercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="space-y-2">
          <Notice tone="danger" title="Extraction Issue">
            {error}
          </Notice>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={extract} disabled={busy || !ready} icon={<IconSparkle size={16} />}>
              Retry Extraction
            </Button>
            <Button variant="ghost" onClick={() => navigate("/add")}>
              Enter Manually
            </Button>
          </div>
        </div>
      ) : null}

      <Button onClick={extract} loading={busy} disabled={!ready} icon={<IconSparkle size={18} />}>
        {busy ? "Reading document…" : "Extract details"}
      </Button>

      <Button variant="ghost" onClick={() => navigate("/add")}>
        Enter manually instead
      </Button>
    </Screen>
  );
}
