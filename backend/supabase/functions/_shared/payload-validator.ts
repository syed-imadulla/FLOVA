// =====================================================================
// FLOVA SEC-04: Secure Payload Validator & Bounded Stream Reader
// Enforces:
// 1. Hard request-body limits before JSON parsing via bounded stream reading.
// 2. HTTP 413 for oversized requests (including chunked requests without Content-Length).
// 3. Strict base64 syntax validation and decoded size pre-calculation.
// 4. File signature (magic bytes) validation and anti-MIME spoofing for:
//    - Images: JPEG, PNG, WebP
//    - Audio: WebM, Ogg, WAV, MP4/M4A/AAC, MP3, FLAC
// 5. Zero quota consumption and zero AI provider invocations on invalid requests.
// =====================================================================

export const MAX_REQUEST_BODY_BYTES = 10 * 1024 * 1024; // 10 MB HTTP body limit
export const MAX_DECODED_MEDIA_BYTES = 10 * 1024 * 1024; // 10 MB decoded binary payload limit
export const MIN_DECODED_MEDIA_BYTES = 16; // Minimum media header size
export const MAX_TEXT_LENGTH = 10000; // 10k character limit for transcript/receipt text

// ---------------------------------------------------------------------
// 1. Bounded Stream Reading & Safe JSON Parsing
// ---------------------------------------------------------------------

export interface BoundedJsonResult<T> {
  ok: boolean;
  status?: 400 | 413;
  error?: string;
  data?: T;
}

/**
 * Reads an HTTP Request body with strict byte-level bounds before decoding or parsing JSON.
 * Immediately cancels the ReadableStream reader if incoming chunks exceed maxBytes.
 * Completely immune to chunked-encoding size evasion attacks.
 */
export async function readBoundedJsonBody<T = unknown>(
  req: Request,
  maxBytes: number = MAX_REQUEST_BODY_BYTES
): Promise<BoundedJsonResult<T>> {
  // 1. Early Content-Length header rejection
  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10);
    if (!isNaN(contentLength) && contentLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        error: `Request body exceeds maximum limit of ${maxBytes} bytes (Content-Length: ${contentLength}).`,
      };
    }
  }

  // 2. Empty body check
  if (!req.body) {
    return {
      ok: false,
      status: 400,
      error: "Request body cannot be empty.",
    };
  }

  // 3. Bounded stream reader
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          // Immediately cancel the stream reader to prevent memory exhaustion
          try {
            await reader.cancel("Request body exceeded maximum limit");
          } catch {
            // Ignore stream cancel errors
          }
          return {
            ok: false,
            status: 413,
            error: `Request body exceeds maximum limit of ${maxBytes} bytes.`,
          };
        }
        chunks.push(value);
      }
    }
  } catch (streamErr: any) {
    return {
      ok: false,
      status: 400,
      error: `Error reading request body: ${streamErr?.message || "stream read error"}`,
    };
  }

  if (totalBytes === 0) {
    return {
      ok: false,
      status: 400,
      error: "Request body cannot be empty.",
    };
  }

  // 4. Concatenate chunks into a single contiguous buffer
  const fullBuffer = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    fullBuffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  // 5. Strict UTF-8 validation
  let text: string;
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    text = decoder.decode(fullBuffer);
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Request body contains invalid UTF-8 encoding.",
    };
  }

  // 6. Safe JSON parse
  try {
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Invalid JSON in request body.",
    };
  }
}

// ---------------------------------------------------------------------
// 2. Strict Base64 Validation & Sizing
// ---------------------------------------------------------------------

export interface Base64ValidationResult {
  ok: boolean;
  status?: 400 | 413;
  error?: string;
  rawBase64?: string;
  declaredMime?: string | null;
  decodedSize?: number;
  bytes?: Uint8Array;
}

/**
 * Parses and validates base64 strings strictly.
 * - Strips optional data URL prefixes (`data:mime;base64,...`).
 * - Validates base64 character set, length multiples of 4, and canonical padding bits.
 * - Computes decoded byte length BEFORE decoding.
 * - Enforces size bounds before memory allocation.
 */
export function validateAndDecodeBase64(
  input: string,
  maxDecodedBytes: number = MAX_DECODED_MEDIA_BYTES,
  minDecodedBytes: number = MIN_DECODED_MEDIA_BYTES
): Base64ValidationResult {
  if (typeof input !== "string" || input.trim().length === 0) {
    return { ok: false, status: 400, error: "Base64 payload cannot be empty." };
  }

  let cleanInput = input.trim();
  let declaredMime: string | null = null;

  // Extract data URL prefix if present
  const dataUrlMatch = cleanInput.match(/^data:([^;,]+)(?:;charset=[^;,]+)?(?:;base64)?,(.*)$/is);
  if (dataUrlMatch) {
    declaredMime = dataUrlMatch[1].trim().toLowerCase();
    cleanInput = dataUrlMatch[2].trim();
  }

  // Remove any remaining newlines or whitespace
  cleanInput = cleanInput.replace(/\s+/g, "");

  if (cleanInput.length === 0) {
    return { ok: false, status: 400, error: "Base64 data cannot be empty." };
  }

  // 1. Length must be a multiple of 4
  if (cleanInput.length % 4 !== 0) {
    return {
      ok: false,
      status: 400,
      error: "Invalid base64 length: length must be a multiple of 4.",
    };
  }

  // 2. Strict character set check: [A-Za-z0-9+/] and '=' padding only
  const BASE64_CHAR_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!BASE64_CHAR_REGEX.test(cleanInput)) {
    return {
      ok: false,
      status: 400,
      error: "Malformed base64: contains invalid characters.",
    };
  }

  // 3. Padding placement and canonical bits check
  let padding = 0;
  if (cleanInput.endsWith("==")) {
    padding = 2;
    const thirdFromEnd = cleanInput[cleanInput.length - 3];
    // In canonical base64, the character before '==' must have 4 trailing zero bits: [A, Q, g, w]
    if (!"AQgw".includes(thirdFromEnd)) {
      return {
        ok: false,
        status: 400,
        error: "Malformed base64: non-canonical padding bits.",
      };
    }
  } else if (cleanInput.endsWith("=")) {
    padding = 1;
    const secondFromEnd = cleanInput[cleanInput.length - 2];
    // In canonical base64, the character before '=' must have 2 trailing zero bits: [A,E,I,M,Q,U,Y,c,g,k,o,s,w,0,4,8]
    if (!"AEIMQUYcgkosw048".includes(secondFromEnd)) {
      return {
        ok: false,
        status: 400,
        error: "Malformed base64: non-canonical padding bits.",
      };
    }
  }

  // Disallow '=' anywhere other than the very end
  const firstEqual = cleanInput.indexOf("=");
  if (firstEqual !== -1 && firstEqual < cleanInput.length - padding) {
    return {
      ok: false,
      status: 400,
      error: "Malformed base64: unexpected '=' padding character inside payload.",
    };
  }

  // 4. Calculate decoded byte size BEFORE decoding
  const decodedSize = Math.floor((cleanInput.length * 3) / 4) - padding;

  if (decodedSize < minDecodedBytes) {
    return {
      ok: false,
      status: 400,
      error: `Decoded payload is too small (${decodedSize} bytes). Minimum required is ${minDecodedBytes} bytes.`,
    };
  }

  if (decodedSize > maxDecodedBytes) {
    return {
      ok: false,
      status: 413,
      error: `Payload exceeds maximum decoded limit of ${maxDecodedBytes} bytes (${decodedSize} bytes decoded).`,
    };
  }

  // 5. Decode into Uint8Array
  let bytes: Uint8Array;
  try {
    const binary = atob(cleanInput);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 400,
      error: `Failed to decode base64 payload: ${err?.message || "decoding error"}`,
    };
  }

  return {
    ok: true,
    rawBase64: cleanInput,
    declaredMime,
    decodedSize,
    bytes,
  };
}

// ---------------------------------------------------------------------
// 3. File Signature (Magic Bytes) & MIME Validation: Images
// ---------------------------------------------------------------------

export type SupportedImageFormat = "jpeg" | "png" | "webp";

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export interface ValidatedImageResult {
  ok: boolean;
  status?: 400 | 413;
  error?: string;
  format?: SupportedImageFormat;
  canonicalMime?: string;
  bytes?: Uint8Array;
  rawBase64?: string;
}

/**
 * Detects image file signature from binary magic bytes.
 */
export function detectImageSignature(bytes: Uint8Array): SupportedImageFormat | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A
  ) {
    return "png";
  }

  // WebP: RIFF (bytes 0-3: 52 49 46 46) + WEBP (bytes 8-11: 57 45 42 50)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

/**
 * Validates receipt image payload:
 * - Decodes base64 safely.
 * - Detects true file signature.
 * - Verifies declared MIME matches file signature (anti-spoofing).
 */
export function validateReceiptImagePayload(
  imageBase64: string,
  explicitMime?: string
): ValidatedImageResult {
  const b64 = validateAndDecodeBase64(imageBase64);
  if (!b64.ok || !b64.bytes) {
    return { ok: false, status: b64.status, error: b64.error };
  }

  const bytes = b64.bytes;
  const detectedFormat = detectImageSignature(bytes);

  if (!detectedFormat) {
    return {
      ok: false,
      status: 400,
      error: "Invalid image file signature. Supported formats: JPEG, PNG, WebP.",
    };
  }

  // Check declared MIME type from either explicit parameter or data URL prefix
  const rawDeclared = explicitMime || b64.declaredMime;
  const normalizedMime = rawDeclared
    ? rawDeclared.split(";")[0].trim().toLowerCase()
    : null;

  if (normalizedMime) {
    if (!ALLOWED_IMAGE_MIMES.includes(normalizedMime)) {
      return {
        ok: false,
        status: 400,
        error: `Unsupported image MIME type "${normalizedMime}". Supported types: image/jpeg, image/png, image/webp.`,
      };
    }

    // Anti-spoofing verification
    if (
      (normalizedMime === "image/jpeg" || normalizedMime === "image/jpg") &&
      detectedFormat !== "jpeg"
    ) {
      return {
        ok: false,
        status: 400,
        error: `MIME type spoofing detected: declared "${normalizedMime}" does not match file signature (detected ${detectedFormat}).`,
      };
    }
    if (normalizedMime === "image/png" && detectedFormat !== "png") {
      return {
        ok: false,
        status: 400,
        error: `MIME type spoofing detected: declared "${normalizedMime}" does not match file signature (detected ${detectedFormat}).`,
      };
    }
    if (normalizedMime === "image/webp" && detectedFormat !== "webp") {
      return {
        ok: false,
        status: 400,
        error: `MIME type spoofing detected: declared "${normalizedMime}" does not match file signature (detected ${detectedFormat}).`,
      };
    }
  }

  const canonicalMime =
    detectedFormat === "jpeg"
      ? "image/jpeg"
      : detectedFormat === "png"
      ? "image/png"
      : "image/webp";

  return {
    ok: true,
    format: detectedFormat,
    canonicalMime,
    bytes,
    rawBase64: b64.rawBase64,
  };
}

// ---------------------------------------------------------------------
// 4. File Signature (Magic Bytes) & MIME Validation: Audio
// ---------------------------------------------------------------------

export type SupportedAudioFormat = "webm" | "ogg" | "wav" | "mp4" | "mp3" | "flac";

export const ALLOWED_AUDIO_MIMES = [
  "audio/webm",
  "audio/ogg",
  "application/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/mpeg",
  "audio/mp3",
  "audio/flac",
];

export interface ValidatedAudioResult {
  ok: boolean;
  status?: 400 | 413;
  error?: string;
  format?: SupportedAudioFormat;
  canonicalMime?: string;
  extension?: string;
  bytes?: Uint8Array;
  rawBase64?: string;
}

/**
 * Detects audio file signature from binary magic bytes across all supported client formats.
 */
export function detectAudioSignature(bytes: Uint8Array): SupportedAudioFormat | null {
  if (bytes.length < 4) return null;

  // 1. WebM / Matroska: 1A 45 DF A3
  if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
    return "webm";
  }

  // 2. Ogg: OggS (4F 67 67 53)
  if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return "ogg";
  }

  // 3. WAV: RIFF....WAVE
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45  // WAVE
  ) {
    return "wav";
  }

  // 4. MP4 / M4A (ISO BMFF): offset 4 is 'ftyp' (66 74 79 70)
  if (
    bytes.length >= 8 &&
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) {
    return "mp4";
  }

  // Raw AAC ADTS syncword: 0xFF followed by 0xF0-0xF9
  if (bytes.length >= 2 && bytes[0] === 0xFF && (bytes[1] & 0xF6) === 0xF0) {
    return "mp4";
  }

  // 5. MP3: ID3 tag (49 44 33) or MPEG audio syncword (0xFF followed by 0xE0-0xFF)
  if (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return "mp3";
  }
  if (bytes.length >= 2 && bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) {
    return "mp3";
  }

  // 6. FLAC: fLaC (66 4C 61 43)
  if (bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) {
    return "flac";
  }

  return null;
}

/**
 * Validates audio payload:
 * - Decodes base64 safely.
 * - Detects true file signature.
 * - Enforces anti-MIME spoofing.
 * - Maps to canonical MIME and file extension for Groq Whisper and IndicConformer.
 */
export function validateAudioPayload(
  audioBase64: string,
  explicitMime?: string
): ValidatedAudioResult {
  const b64 = validateAndDecodeBase64(audioBase64);
  if (!b64.ok || !b64.bytes) {
    return { ok: false, status: b64.status, error: b64.error };
  }

  const bytes = b64.bytes;
  const detectedFormat = detectAudioSignature(bytes);

  if (!detectedFormat) {
    return {
      ok: false,
      status: 400,
      error: "Invalid audio file signature. Supported formats: WebM, Ogg, WAV, MP4/M4A, MP3, FLAC.",
    };
  }

  // Check declared MIME type from either explicit parameter or data URL prefix
  const rawDeclared = explicitMime || b64.declaredMime;
  const normalizedMime = rawDeclared
    ? rawDeclared.split(";")[0].trim().toLowerCase()
    : null;

  if (normalizedMime) {
    if (!ALLOWED_AUDIO_MIMES.includes(normalizedMime)) {
      return {
        ok: false,
        status: 400,
        error: `Unsupported audio MIME type "${normalizedMime}".`,
      };
    }

    // Anti-spoofing verification
    if (normalizedMime.includes("webm") && detectedFormat !== "webm") {
      return {
        ok: false,
        status: 400,
        error: `MIME type spoofing detected: declared "${normalizedMime}" does not match file signature (detected ${detectedFormat}).`,
      };
    }
    if ((normalizedMime.includes("ogg")) && detectedFormat !== "ogg") {
      return {
        ok: false,
        status: 400,
        error: `MIME type spoofing detected: declared "${normalizedMime}" does not match file signature (detected ${detectedFormat}).`,
      };
    }
    if ((normalizedMime.includes("wav") || normalizedMime.includes("wave")) && detectedFormat !== "wav") {
      return {
        ok: false,
        status: 400,
        error: `MIME type spoofing detected: declared "${normalizedMime}" does not match file signature (detected ${detectedFormat}).`,
      };
    }
    if (
      (normalizedMime.includes("mp4") || normalizedMime.includes("m4a") || normalizedMime.includes("aac")) &&
      detectedFormat !== "mp4"
    ) {
      return {
        ok: false,
        status: 400,
        error: `MIME type spoofing detected: declared "${normalizedMime}" does not match file signature (detected ${detectedFormat}).`,
      };
    }
    if ((normalizedMime.includes("mpeg") || normalizedMime.includes("mp3")) && detectedFormat !== "mp3") {
      return {
        ok: false,
        status: 400,
        error: `MIME type spoofing detected: declared "${normalizedMime}" does not match file signature (detected ${detectedFormat}).`,
      };
    }
    if (normalizedMime.includes("flac") && detectedFormat !== "flac") {
      return {
        ok: false,
        status: 400,
        error: `MIME type spoofing detected: declared "${normalizedMime}" does not match file signature (detected ${detectedFormat}).`,
      };
    }
  }

  let canonicalMime = "audio/webm";
  let extension = "webm";

  switch (detectedFormat) {
    case "webm":
      canonicalMime = "audio/webm";
      extension = "webm";
      break;
    case "ogg":
      canonicalMime = "audio/ogg";
      extension = "ogg";
      break;
    case "wav":
      canonicalMime = "audio/wav";
      extension = "wav";
      break;
    case "mp4":
      canonicalMime = "audio/mp4";
      extension = "m4a";
      break;
    case "mp3":
      canonicalMime = "audio/mpeg";
      extension = "mp3";
      break;
    case "flac":
      canonicalMime = "audio/flac";
      extension = "flac";
      break;
  }

  return {
    ok: true,
    format: detectedFormat,
    canonicalMime,
    extension,
    bytes,
    rawBase64: b64.rawBase64,
  };
}
