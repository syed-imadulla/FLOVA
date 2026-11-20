// =====================================================================
// FLOVA Audio Recorder Hook (Owner: M4 & M1)
// Records microphone audio using browser MediaRecorder API.
// Features:
// - Dynamic supported MIME type detection (WebM, MP4, OGG, WAV)
// - Recording duration limit (auto-stop at max 60s)
// - Payload size safeguard (10MB)
// - Permission handling and clean stream teardown
// =====================================================================

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "stopped"
  | "error";

export interface AudioRecorderResult {
  status: RecorderStatus;
  audioBlob: Blob | null;
  mimeType: string | null;
  durationSeconds: number;
  errorMessage: string | null;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export const SUPPORTED_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/wav",
];

export function detectSupportedMimeType(): string | null {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return null;
  }
  for (const mime of SUPPORTED_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return ""; // Browser supports MediaRecorder with its default container
}

const MAX_RECORDING_SECONDS = 60; // 60 seconds max voice note limit
const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB limit

export function useAudioRecorder(): AudioRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const isSupported = typeof window !== "undefined" && typeof navigator?.mediaDevices?.getUserMedia === "function" && typeof MediaRecorder !== "undefined";

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore cleanup errors
        }
      });
      mediaStreamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    cleanupStream();
    setStatus("stopped");
  }, [clearTimer, cleanupStream]);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    chunksRef.current = [];
    setDurationSeconds(0);

    if (!isSupported) {
      setErrorMessage("Audio recording is not supported in this browser. Please use typed text input.");
      setStatus("error");
      return;
    }

    const detectedMime = detectSupportedMimeType();
    setMimeType(detectedMime || "audio/webm");

    setStatus("requesting_permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });

      mediaStreamRef.current = stream;

      const options: MediaRecorderOptions = detectedMime ? { mimeType: detectedMime } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        cleanupStream();
        const selectedMime = detectedMime || "audio/webm";
        const combinedBlob = new Blob(chunksRef.current, { type: selectedMime });

        if (combinedBlob.size > MAX_PAYLOAD_BYTES) {
          setErrorMessage("Recorded audio file is too large (> 10MB). Please record a shorter note.");
          setAudioBlob(null);
          setStatus("error");
          return;
        }

        setAudioBlob(combinedBlob);
        setStatus("stopped");
      };

      recorder.onerror = (e: any) => {
        clearTimer();
        cleanupStream();
        setErrorMessage(`Recording error: ${e.error?.message || "Unknown error"}`);
        setStatus("error");
      };

      recorder.start(250); // collect chunks every 250ms
      startTimeRef.current = Date.now();
      setStatus("recording");

      // Start duration countdown/timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDurationSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) {
          // Auto-stop at limit
          stopRecording();
        }
      }, 500);
    } catch (err: any) {
      clearTimer();
      cleanupStream();
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Microphone permission was denied. Please allow microphone access in your browser settings to record voice notes.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No microphone found on this device. Please plug in a microphone or use typed text input.");
      } else {
        setErrorMessage(`Could not access microphone: ${err.message || "Unknown error"}`);
      }
      setStatus("error");
    }
  }, [isSupported, clearTimer, cleanupStream, stopRecording]);

  const resetRecording = useCallback(() => {
    clearTimer();
    cleanupStream();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setAudioBlob(null);
    setDurationSeconds(0);
    setErrorMessage(null);
    setStatus("idle");
  }, [clearTimer, cleanupStream]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      clearTimer();
      cleanupStream();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [clearTimer, cleanupStream]);

  return {
    status,
    audioBlob,
    mimeType,
    durationSeconds,
    errorMessage,
    isSupported,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
