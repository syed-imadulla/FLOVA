// =====================================================================
// FLOVA Voice Recorder Hook (M4)
// Uses Web Speech API for real-time transcription (no API key needed).
// Falls back to MediaRecorder + manual transcript entry when Web Speech
// is unavailable (e.g. Firefox, some mobile browsers).
// =====================================================================

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "processing"
  | "done"
  | "error";

export interface VoiceRecorderResult {
  state: RecorderState;
  transcript: string;
  interimTranscript: string;
  durationSeconds: number;
  errorMessage: string | null;
  supportsWebSpeech: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
  setTranscript: (t: string) => void;
}

const SpeechRecognition =
  (typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
  null;

export function useVoiceRecorder(): VoiceRecorderResult {
  const [state, setState] = useState<RecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const supportsWebSpeech = SpeechRecognition !== null;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setDurationSeconds(0);
    timerRef.current = setInterval(() => {
      setDurationSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }, []);

  const startRecording = useCallback(() => {
    setErrorMessage(null);
    setInterimTranscript("");

    if (!supportsWebSpeech) {
      // No Web Speech — just go to done state so user can type manually
      setState("done");
      setTranscript("");
      return;
    }

    setState("requesting");

    // Check mic permission first (Chrome/Edge require it even for Web Speech)
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Stop the stream immediately — Web Speech manages its own mic
        stream.getTracks().forEach((t) => t.stop());

        const recognition = new SpeechRecognition!();
        recognitionRef.current = recognition;
        recognition.lang = "en-IN";
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = false; // single utterance mode

        let finalText = "";

        recognition.onstart = () => {
          setState("recording");
          startTimer();
        };

        recognition.onresult = (event: Event) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = event as any;
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const result = e.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript + " ";
            } else {
              interim += result[0].transcript;
            }
          }
          setTranscript(finalText.trim());
          setInterimTranscript(interim);
        };

        recognition.onerror = (event: Event) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = event as any;
          clearTimer();
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            setErrorMessage(
              "Microphone permission denied. Please allow microphone access in your browser settings and try again."
            );
          } else if (e.error === "no-speech") {
            setErrorMessage("No speech detected. Please speak clearly and try again.");
          } else if (e.error === "network") {
            setErrorMessage(
              "Speech recognition requires internet. Check your connection or type the transcript manually."
            );
          } else {
            setErrorMessage(`Voice error: ${e.error}. You can type the transaction manually below.`);
          }
          setState("error");
          recognitionRef.current = null;
        };

        recognition.onend = () => {
          clearTimer();
          if (finalText.trim()) {
            setTranscript(finalText.trim());
            setState("done");
          } else {
            // onend fired without final result — keep whatever we have
            setState("done");
          }
          setInterimTranscript("");
          recognitionRef.current = null;
        };

        recognition.start();
      })
      .catch((err: Error) => {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setErrorMessage(
            "Microphone permission denied. Please allow microphone access in your browser settings."
          );
        } else {
          setErrorMessage(`Could not access microphone: ${err.message}`);
        }
        setState("error");
      });
  }, [supportsWebSpeech, clearTimer, startTimer]);

  const stopRecording = useCallback(() => {
    clearTimer();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState("done");
    setInterimTranscript("");
  }, [clearTimer]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setErrorMessage(null);
    setState("idle");
    setDurationSeconds(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, [clearTimer]);

  return {
    state,
    transcript,
    interimTranscript,
    durationSeconds,
    errorMessage,
    supportsWebSpeech,
    startRecording,
    stopRecording,
    clearTranscript,
    setTranscript,
  };
}
