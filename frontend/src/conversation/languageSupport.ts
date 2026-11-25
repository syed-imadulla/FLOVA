// =====================================================================
// FLOVA 2.0 | Sprint 3B — Provider-Independent Language Support
// Supports 11 Indian languages + Hinglish/Kanglish code-mixing.
// =====================================================================

import type { SupportedLanguage } from "./conversationTypes";

const SCRIPT_RANGES: Array<{ code: SupportedLanguage; regex: RegExp }> = [
  { code: "kn", regex: /[\u0C80-\u0CFF]/ },
  { code: "te", regex: /[\u0C00-\u0C7F]/ },
  { code: "ta", regex: /[\u0B80-\u0BFF]/ },
  { code: "ml", regex: /[\u0D00-\u0D7F]/ },
  { code: "bn", regex: /[\u0980-\u09FF]/ },
  { code: "gu", regex: /[\u0A80-\u0AFF]/ },
  { code: "pa", regex: /[\u0A00-\u0A7F]/ },
  { code: "or", regex: /[\u0B00-\u0B7F]/ },
  { code: "hi", regex: /[\u0900-\u097F]/ },
];

export const SUPPORTED_LANGUAGES: ReadonlyArray<SupportedLanguage> = [
  "en", "hi", "kn", "te", "ta", "ml", "bn", "mr", "gu", "pa", "or",
];

export function isSupportedLanguage(code: string): code is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

/**
 * Detects script-based Indic languages, or preserves the user's selected/context
 * language for Latin-script / code-mixed utterances (Hinglish, Kanglish, etc.).
 */
export function detectLanguage(text: string, preferred: SupportedLanguage = "en"): SupportedLanguage {
  const trimmed = text.trim();
  if (!trimmed) return preferred;

  for (const { code, regex } of SCRIPT_RANGES) {
    if (regex.test(trimmed)) {
      if (code === "hi" && preferred === "mr") return "mr";
      return code;
    }
  }

  // Code-mixed Hinglish / Kanglish hints when no explicit non-English language is pinned
  if (preferred === "en") {
    if (/\b(aapne|kitna|kitne|kharch|baaki|mahine|is\s+month|kya|mera|mujhe)\b/i.test(trimmed)) {
      return "hi";
    }
    if (/\b(eshtu|kharchu|oota|nanna|idhe|beku)\b/i.test(trimmed)) {
      return "kn";
    }
  }

  return preferred;
}
