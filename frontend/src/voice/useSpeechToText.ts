// Speech → text in the user's chosen language using the browser's speech recognition
// (Chrome / Android / Edge / iOS Safari 14.5+). Gives a live transcript while speaking and works
// even when the AI Edge Function is unavailable. The transcript is then sent for understanding.
import { useCallback, useEffect, useRef, useState } from "react";

/** App language code → BCP-47 locale used by the recogniser. */
export const SPEECH_LOCALES: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  ta: "ta-IN",
  te: "te-IN",
  ur: "ur-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  ml: "ml-IN",
  gu: "gu-IN",
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type SpeechStatus = "idle" | "listening" | "done" | "error";

export function useSpeechToText() {
  const Ctor = getCtor();
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(
    () => () => {
      clearTimer();
      recRef.current?.abort();
    },
    []
  );

  const start = useCallback(
    (lang: string) => {
      if (!Ctor) return;
      recRef.current?.abort();
      finalRef.current = "";
      setFinalText("");
      setInterim("");
      setError(null);
      setSeconds(0);

      const rec = new Ctor();
      rec.lang = lang === "auto" ? (navigator.language?.endsWith("-IN") ? navigator.language : "en-IN") : SPEECH_LOCALES[lang] ?? "en-IN";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setStatus("listening");
        const t0 = Date.now();
        clearTimer();
        timerRef.current = setInterval(() => {
          const s = Math.floor((Date.now() - t0) / 1000);
          setSeconds(s);
          if (s >= 45) rec.stop(); // keep notes short and bounded
        }, 250);
      };
      rec.onresult = (e: any) => {
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalRef.current = `${finalRef.current} ${r[0].transcript}`.trim();
          else live += r[0].transcript;
        }
        setFinalText(finalRef.current);
        setInterim(live);
      };
      rec.onerror = (e: any) => {
        const code = e?.error as string;
        if (code === "aborted") return;
        const msg =
          code === "not-allowed" || code === "service-not-allowed"
            ? "Microphone access is blocked. Allow it in your browser's site settings and try again."
            : code === "no-speech"
              ? "Didn't hear anything. Tap the mic and speak a little louder."
              : code === "network"
                ? "Speech recognition needs an internet connection."
                : code === "language-not-supported"
                  ? "This language isn't supported for speech on this phone. Try another language or type."
                  : `Speech recognition stopped (${code}).`;
        setError(msg);
      };
      rec.onend = () => {
        clearTimer();
        setInterim("");
        recRef.current = null;
        setStatus(finalRef.current ? "done" : "error");
        if (!finalRef.current) setError((cur) => cur ?? "Didn't catch that. Tap the mic and try again.");
      };

      recRef.current = rec;
      try {
        rec.start();
      } catch {
        setError("Couldn't start the microphone. Please try again.");
        setStatus("error");
      }
    },
    [Ctor]
  );

  const stop = useCallback(() => recRef.current?.stop(), []);
  const reset = useCallback(() => {
    recRef.current?.abort();
    finalRef.current = "";
    setFinalText("");
    setInterim("");
    setError(null);
    setStatus("idle");
  }, []);

  return { supported: !!Ctor, status, finalText, interim, error, seconds, start, stop, reset };
}
