// Scan a receipt (FLOVA Catch) — the extract-receipt Edge Function suggests an expense,
// then the shared review screen confirms it. Receipts are "receipt reported", never verified.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paiseToInput } from "../app/moneyText";
import type { ReviewState } from "./AddScreen";
import { todayLocalISO } from "../data/dates";
import { extractReceipt } from "../services/receipt";
import { Button, Card, Notice, Screen, Segmented } from "../ui/kit";
import { IconCamera, IconImage, IconSparkle } from "../ui/icons";

export function CatchScreen() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"photo" | "text">("photo");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function pick(f: File | null) {
    setError(null);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
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
      const state: ReviewState = {
        origin: "receipt",
        candidateId: c.id || c.candidate_id,
        merchant: c.merchant,
        aiNote: `Read from your receipt${c.merchant ? ` (${c.merchant})` : ""}.${missing.length ? ` Please fill in: ${missing.join(", ")}.` : " Check the details below."}`,
        draft: {
          type: "expense",
          amount: paiseToInput(c.amountPaise ?? c.amount_paise ?? null),
          category: c.category || "",
          expenseType: (c.expenseType ?? c.expense_type ?? "") || "",
          ownership: "mine",
          date: c.date || todayLocalISO(),
          note: c.description || c.notes || c.merchant || "",
        },
      };
      navigate("/add", { state });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        /failed to send|not found|fetch/i.test(msg)
          ? "The FLOVA receipt-reading service isn't reachable right now. You can enter this expense manually."
          : msg || "Couldn't read the receipt. You can enter it manually instead."
      );
    } finally {
      setBusy(false);
    }
  }

  const ready = mode === "photo" ? !!file : text.trim().length > 0;

  return (
    <Screen title="Scan a receipt" subtitle="FLOVA reads it, you confirm it" back>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "photo", label: "Photo" },
          { value: "text", label: "Paste text / SMS" },
        ]}
      />

      {mode === "photo" ? (
        <Card className="p-4 space-y-3">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-line bg-[#FAFBF8] flex flex-col items-center justify-center gap-2 overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Selected receipt" className="w-full h-full object-contain" />
            ) : (
              <>
                <span className="w-14 h-14 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center">
                  <IconCamera size={26} />
                </span>
                <span className="text-[15px] font-semibold text-ink">Take or choose a photo</span>
                <span className="text-xs text-ink-muted">Bills, fuel slips, shop receipts</span>
              </>
            )}
          </button>
          {preview ? (
            <Button variant="secondary" icon={<IconImage size={18} />} onClick={() => fileRef.current?.click()}>
              Choose a different photo
            </Button>
          ) : null}
        </Card>
      ) : (
        <Card className="p-4 space-y-2">
          <label htmlFor="receipt-text" className="block text-[13px] font-semibold text-ink-soft">
            Paste receipt text or a payment SMS
          </label>
          <textarea
            id="receipt-text"
            rows={5}
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Rs.300.00 debited at HP Petrol Pump on 21-11"
            className="w-full rounded-xl border border-line bg-white p-3.5 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 resize-none"
          />
        </Card>
      )}

      {error ? <Notice tone="danger" title="Couldn't read that">{error}</Notice> : null}

      <Button onClick={extract} loading={busy} disabled={!ready} icon={<IconSparkle size={18} />}>
        {busy ? "Reading…" : "Read receipt"}
      </Button>
      <Button variant="ghost" onClick={() => navigate("/add")}>
        Enter manually instead
      </Button>
    </Screen>
  );
}
