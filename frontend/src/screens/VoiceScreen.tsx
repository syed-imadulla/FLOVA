// Add by voice — speak or type in your language. Speech becomes text (browser recogniser, or
// Groq Whisper via the process-voice Edge Function), then the AI layer *suggests* a transaction.
// Every result opens a review screen; nothing is saved here.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { paiseToInput, rupeeStringToInput } from "../app/moneyText";
import type { QueuedReviewCandidate, ReviewState } from "./AddScreen";
import type { CheckinPrefillState } from "./CheckinScreen";
import type { PayoutPrefillState } from "./PayoutsScreen";
import { todayLocalISO } from "../data/dates";
import { useRunway } from "../runway/useRunway";
import { processVoice, resolveFinancialQuery, type QueryResolutionResult, type VoiceProcessResult } from "../services/voice";
import { useAudioRecorder } from "../voice/useAudioRecorder";
import { useSpeechToText } from "../voice/useSpeechToText";
import { Button, Card, Chip, Notice, Screen, Segmented, cx } from "../ui/kit";
import { IconImage, IconKeyboard, IconMic, IconSparkle, IconStop } from "../ui/icons";

const LANGS = [
  { value: "auto", label: "Auto" },
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
  { value: "kn", label: "ಕನ್ನಡ" },
  { value: "ta", label: "தமிழ்" },
  { value: "te", label: "తెలుగు" },
  { value: "ml", label: "മലയാളം" },
  { value: "mr", label: "मराठी" },
  { value: "bn", label: "বাংলা" },
  { value: "gu", label: "ગુજરાતી" },
  { value: "ur", label: "اردو" },
];
const LANG_KEY = "flova.voiceLanguage";

const EXAMPLES: Record<string, string[]> = {
  en: ["Earned 850 today", "Spent 150 on food", "Petrol 300 for work", "Received platform payout of 2,000"],
  hi: ["आज 850 कमाए", "खाने पर 150 खर्च किए", "पेट्रोल 300 डाला"],
  kn: ["ಇವತ್ತು 850 ಗಳಿಸಿದೆ", "ಊಟಕ್ಕೆ 150 ಖರ್ಚು", "ಪೆಟ್ರೋಲ್ 300 ಹಾಕಿಸಿದೆ"],
  ta: ["இன்று 850 சம்பாதித்தேன்", "சாப்பாடு 150 செலவு", "பெட்ரோல் 300 போட்டேன்"],
  te: ["ఈరోజు 850 వచ్చింది", "భోజనం 150 ఖర్చు", "పెట్రోల్ 300 పోశాను"],
  ur: ["آج 850 کمائے", "کھانے پر 150 خرچ کیے"],
};

function readLang(): string {
  try {
    return localStorage.getItem(LANG_KEY) || "auto";
  } catch {
    return "auto";
  }
}

export function VoiceScreen() {
  const navigate = useNavigate();
  const speech = useSpeechToText();
  const recorder = useAudioRecorder();
  const { runway, rawInput } = useRunway({ horizonDays: 7 });
  const [mode, setMode] = useState<"voice" | "type">("voice");
  const [lang, setLang] = useState<string>(readLang);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{ q: string; r: QueryResolutionResult } | null>(null);
  const [unclear, setUnclear] = useState<string | null>(null);
  const [aiOffline, setAiOffline] = useState(false);
  const handledBlob = useRef<Blob | null>(null);
  const handledSpeech = useRef<string>("");

  // Prefer the browser recogniser (live transcript, many Indian languages); fall back to
  // recording audio for Groq Whisper on browsers without it.
  const useBrowserSpeech = speech.supported;

  function chooseLang(v: string) {
    setLang(v);
    try {
      localStorage.setItem(LANG_KEY, v);
    } catch {
      /* per-device convenience only */
    }
  }

  // Browser speech finished → understand the transcript.
  useEffect(() => {
    if (speech.status === "done" && speech.finalText && handledSpeech.current !== speech.finalText) {
      handledSpeech.current = speech.finalText;
      void run({ text: speech.finalText, spoken: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.status, speech.finalText]);

  // Audio recording finished (Whisper path) → transcribe + understand.
  useEffect(() => {
    if (recorder.status === "stopped" && recorder.audioBlob && handledBlob.current !== recorder.audioBlob) {
      handledBlob.current = recorder.audioBlob;
      void run({ blob: recorder.audioBlob, spoken: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status, recorder.audioBlob]);

  async function run(input: { blob?: Blob; text?: string; spoken?: boolean }) {
    setBusy(true);
    setError(null);
    setAnswer(null);
    setUnclear(null);
    try {
      const res: VoiceProcessResult = await processVoice({
        audioBlob: input.blob,
        mimeType: recorder.mimeType || undefined,
        text: input.text,
        language: lang === "auto" ? undefined : lang,
      });
      const offline = res.source !== "edge_function";
      setAiOffline(offline);
      if (input.blob && offline) {
        setError("The FLOVA voice AI service isn't reachable, so this recording couldn't be transcribed. Type it instead, or try again later.");
        return;
      }
      routeResult(res, input.text ?? "", offline);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
      recorder.resetRecording();
    }
  }

  function routeResult(res: VoiceProcessResult, typed: string, offline: boolean) {
    const said = res.transcript || typed;
    const dto = res.extraction;
    const intent = dto.entry_intent;
    const how = offline ? "Understood with basic on-device matching. Please check each field." : "Understood by FLOVA AI. Check the details below.";
    const aiNote = said ? `FLOVA heard: “${said}”. ${how}` : how;

    if (intent === "transaction") {
      const candidates = res.candidates && res.candidates.length > 0 ? res.candidates : res.candidate ? [res.candidate] : [];
      const txList = Array.isArray(dto.transactions) && dto.transactions.length > 0 ? dto.transactions : dto.transaction ? [dto.transaction] : [];

      if (candidates.length > 1) {
        // Multi-transaction utterance: Queue each distinct transaction for sequential review on /add
        const first = candidates[0];
        const firstTx = txList[0];
        const firstType = first.type ?? firstTx?.type ?? "expense";

        const remainingCandidates: QueuedReviewCandidate[] = candidates.slice(1).map((cand, idx) => {
          const tx = txList[idx + 1];
          const tType = cand.type ?? tx?.type ?? "expense";
          return {
            candidateId: cand.id || cand.candidate_id || `cand-${Date.now()}-${idx + 1}`,
            draft: {
              type: tType,
              amount: paiseToInput(cand.amountPaise ?? cand.amount_paise ?? null) || rupeeStringToInput(tx?.amount),
              category: cand.category || tx?.category || (tType === "income" ? "earnings" : "other"),
              expenseType: (cand.expenseType ?? cand.expense_type ?? tx?.expense_type ?? "") || "",
              ownership: cand.ownership ?? tx?.ownership ?? "mine",
              date: cand.date || tx?.date || todayLocalISO(),
              note: tx?.description || cand.description || "",
            },
            transcript: said,
            aiNote: `FLOVA extracted multiple transactions from: “${said}”. Reviewing entry ${idx + 2} of ${candidates.length}.`,
          };
        });

        const state: ReviewState = {
          origin: "voice",
          candidateId: first.id || first.candidate_id,
          transcript: said,
          aiNote: `FLOVA extracted ${candidates.length} transactions from: “${said}”. Reviewing 1 of ${candidates.length}:`,
          remainingCandidates,
          queueIndex: 1,
          queueTotal: candidates.length,
          draft: {
            type: firstType,
            amount: paiseToInput(first.amountPaise ?? first.amount_paise ?? null) || rupeeStringToInput(firstTx?.amount),
            category: first.category || firstTx?.category || (firstType === "income" ? "earnings" : "other"),
            expenseType: (first.expenseType ?? first.expense_type ?? firstTx?.expense_type ?? "") || "",
            ownership: first.ownership ?? firstTx?.ownership ?? "mine",
            date: first.date || firstTx?.date || todayLocalISO(),
            note: firstTx?.description || first.description || "",
          },
        };
        navigate("/add", { state });
        return;
      }

      const c = res.candidate;
      const tx = dto.transaction;
      const type = c?.type ?? tx?.type ?? "expense";
      const state: ReviewState = {
        origin: "voice",
        candidateId: c?.id || c?.candidate_id,
        transcript: said,
        aiNote,
        draft: {
          type,
          amount: c ? paiseToInput(c.amountPaise ?? c.amount_paise ?? null) : rupeeStringToInput(tx?.amount),
          category: c?.category || tx?.category || (type === "income" ? "earnings" : ""),
          expenseType: (c?.expenseType ?? c?.expense_type ?? tx?.expense_type ?? "") || "",
          ownership: c?.ownership ?? tx?.ownership ?? "mine",
          date: c?.date || tx?.date || todayLocalISO(),
          note: tx?.description || "",
        },
      };
      navigate("/add", { state });
      return;
    }
    if (intent === "expected_payout" && dto.expected_payout) {
      const ep = dto.expected_payout;
      const state: PayoutPrefillState = {
        aiNote,
        prefill: { amount: rupeeStringToInput(ep.expected_amount), source: ep.source || "", date: ep.expected_date || "", kind: ep.kind || undefined },
      };
      navigate("/payouts", { state });
      return;
    }
    if (intent === "balance_checkin" && dto.balance_checkin) {
      const bc = dto.balance_checkin;
      const state: CheckinPrefillState = {
        aiNote,
        prefill: { cash: rupeeStringToInput(bc.cash_amount), bank: rupeeStringToInput(bc.bank_amount), held: rupeeStringToInput(bc.not_mine_amount) },
      };
      navigate("/checkin", { state });
      return;
    }
    if ((intent === "financial_query" || intent === "query") && (dto.financial_query || dto.query)) {
      setAnswer({ q: said, r: resolveFinancialQuery((dto.financial_query || dto.query)!, rawInput, runway) });
      return;
    }
    setUnclear(
      dto.metadata?.clarification_questions?.[0] ||
        (said
          ? `FLOVA couldn't find an amount or transaction in “${said}”. Say the amount and what it was for${offline ? ", or type it" : ""}.`
          : "FLOVA couldn't hear that clearly. Please try again.")
    );
  }

  const listening = useBrowserSpeech ? speech.status === "listening" : recorder.status === "recording" || recorder.status === "requesting_permission";
  const secs = useBrowserSpeech ? speech.seconds : recorder.durationSeconds;
  const canRecord = useBrowserSpeech || recorder.isSupported;
  const liveText = useBrowserSpeech ? `${speech.finalText} ${speech.interim}`.trim() : "";
  const micError = useBrowserSpeech ? (speech.status === "error" ? speech.error : null) : recorder.errorMessage;
  const examples = EXAMPLES[lang] ?? EXAMPLES.en;

  function toggleMic() {
    setError(null);
    setUnclear(null);
    setAnswer(null);
    if (useBrowserSpeech) {
      if (listening) speech.stop();
      else {
        handledSpeech.current = "";
        speech.start(lang);
      }
    } else {
      if (listening) recorder.stopRecording();
      else void recorder.startRecording();
    }
  }

  return (
    <Screen title="Add by voice" subtitle="Speak in your language. You'll review before anything is saved.">
      <Segmented
        value={mode}
        onChange={(m) => {
          if (listening) toggleMic();
          setMode(m);
        }}
        options={[
          { value: "voice", label: "Voice" },
          { value: "type", label: "Type" },
        ]}
      />

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar" aria-label="Language">
        {LANGS.map((l) => (
          <Chip key={l.value} active={lang === l.value} onClick={() => chooseLang(l.value)}>
            {l.label}
          </Chip>
        ))}
      </div>

      {mode === "voice" ? (
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="relative w-[168px] h-[168px] flex items-center justify-center">
            {listening ? (
              <>
                <span className="absolute inset-0 rounded-full bg-brand-200 animate-pulseRing" />
                <span className="absolute inset-3 rounded-full bg-brand-100 animate-pulseRing [animation-delay:400ms]" />
              </>
            ) : (
              <span className="absolute inset-0 rounded-full bg-brand-50" />
            )}
            <button
              type="button"
              disabled={busy || !canRecord}
              onClick={toggleMic}
              aria-label={listening ? "Stop" : "Start speaking"}
              className={cx(
                "relative w-[120px] h-[120px] rounded-full flex items-center justify-center text-white shadow-fab transition-transform active:scale-95 disabled:opacity-60",
                listening ? "bg-red-600" : "bg-brand-700"
              )}
            >
              {listening ? <IconStop size={40} /> : <IconMic size={48} />}
            </button>
          </div>

          <div className="min-h-[72px] mt-4 w-full flex flex-col items-center justify-center">
            {busy ? (
              <p className="text-[15px] font-semibold text-brand-800 inline-flex items-center gap-2">
                <IconSparkle size={18} className="animate-spin [animation-duration:2s]" /> Understanding…
              </p>
            ) : listening ? (
              <>
                <p className="text-[15px] font-semibold text-brand-800">Listening… {secs > 0 ? `0:${String(secs).padStart(2, "0")}` : ""}</p>
                {liveText ? (
                  <p className="mt-2 text-[15px] text-ink leading-6 break-words max-w-full">“{liveText}”</p>
                ) : (
                  <div className="mt-2 flex items-center gap-[3px] h-5" aria-hidden="true">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <span key={i} className="w-[3px] h-full rounded-full bg-brand-600 animate-wave origin-center" style={{ animationDelay: `${(i * 70) % 700}ms` }} />
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-ink-muted">Tap the button when you're done</p>
              </>
            ) : (
              <p className="text-[15px] font-semibold text-ink-soft">{canRecord ? "Tap and speak" : "Voice isn't supported in this browser. Use Type."}</p>
            )}
          </div>
          {micError ? <p className="mt-1 text-xs text-red-700">{micError}</p> : null}
        </Card>
      ) : (
        <Card className="p-4 space-y-3">
          <label htmlFor="voice-text" className="block text-[13px] font-semibold text-ink-soft">
            Type what happened, in any language
          </label>
          <textarea
            id="voice-text"
            rows={3}
            value={text}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
            placeholder={examples[1] ?? "e.g. Spent 150 on food"}
            className="w-full rounded-xl border border-line bg-white p-3.5 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 resize-none"
          />
          <Button onClick={() => text.trim() && run({ text: text.trim() })} loading={busy} disabled={!text.trim()} icon={<IconSparkle size={18} />}>
            Understand
          </Button>
        </Card>
      )}

      {aiOffline && !error ? (
        <Notice tone="warn" title="FLOVA AI is offline">
          Using basic on-device matching (English, Hindi, Kannada, Tamil, Telugu, Urdu). Simple phrases with an amount work best.
        </Notice>
      ) : null}
      {error ? <Notice tone="danger" title="Couldn't process that">{error}</Notice> : null}
      {unclear ? <Notice tone="warn" title="Let's try that again">{unclear}</Notice> : null}

      {answer ? (
        <Card tone="brand" className="p-4 space-y-2">
          {answer.q ? <p className="text-xs text-brand-800">You asked: “{answer.q}”</p> : null}
          <p className="text-[15px] font-semibold text-ink">{answer.r.answer}</p>
          {answer.r.details.length ? (
            <ul className="text-[13px] text-ink-soft list-disc pl-5 space-y-0.5">
              {answer.r.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}

      <Card tone="soft" className="p-4">
        <p className="text-[13px] font-semibold text-ink-soft mb-2">Try saying</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setMode("type");
                setText(e);
              }}
              className="min-h-8 py-1 px-3 rounded-full bg-white border border-line text-[13px] text-ink-soft hover:border-brand-200 text-left"
            >
              “{e}”
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/add" className="h-12 rounded-xl border border-line bg-white flex items-center justify-center gap-2 text-sm font-semibold text-ink">
          <IconKeyboard size={18} /> Enter manually
        </Link>
        <Link to="/catch" className="h-12 rounded-xl border border-line bg-white flex items-center justify-center gap-2 text-sm font-semibold text-ink">
          <IconImage size={18} /> Scan a receipt
        </Link>
      </div>
    </Screen>
  );
}
