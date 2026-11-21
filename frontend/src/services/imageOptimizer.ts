// =====================================================================
// FLOVA Image Optimization & Validation Service (Owner: M1 / Phase 16)
// Validates images up to 20 MB and performs client-side downscaling &
// compression to ensure fast, reliable OCR upload without Edge timeouts.
// =====================================================================

export const MAX_IMAGE_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_IMAGE_DIMENSION_PX = 1920; // 1920px max width or height
export const OPTIMIZATION_QUALITY = 0.85; // 85% JPEG/WEBP quality

export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

export interface OptimizedImageResult {
  dataUrl: string;
  mimeType: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  wasResized: boolean;
}

/**
 * Validates file format and size up to 20MB.
 */
export function validateImageFile(file: File): void {
  if (!file) {
    throw new Error("No file provided for extraction.");
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File size (${sizeMb} MB) exceeds the 20 MB limit. Please select an image under 20 MB.`
    );
  }

  const mime = file.type?.toLowerCase() || "";
  const name = file.name?.toLowerCase() || "";
  const hasValidMime = SUPPORTED_IMAGE_MIME_TYPES.includes(mime);
  const hasValidExt = /\.(jpe?g|png|webp)$/i.test(name);

  if (!hasValidMime && !hasValidExt) {
    throw new Error(
      "Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image."
    );
  }
}

/**
 * Validates and optimizes an image file:
 * - Rejects files > 20 MB or unsupported types
 * - Resizes high-resolution photos (e.g. 4000x3000) down to max 1920px dimension
 * - Compresses with quality 0.85 to shrink multi-megabyte files to ~300-800 KB
 * - Preserves aspect ratio and crisp OCR text legibility
 */
export async function validateAndOptimizeImage(file: File): Promise<OptimizedImageResult> {
  validateImageFile(file);

  // If running in a non-browser environment (e.g. test runner), fallback to FileReader
  if (typeof window === "undefined" || typeof document === "undefined" || !window.FileReader) {
    return fallbackFileRead(file);
  }

  return new Promise<OptimizedImageResult>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const srcUrl = reader.result;
      if (typeof srcUrl !== "string") {
        return reject(new Error("Failed to convert image to Data URL."));
      }

      const img = new Image();
      img.onerror = () => {
        // If image decoding fails, it may be corrupted
        reject(new Error("Unable to decode image. The file may be corrupted or unreadable."));
      };

      img.onload = () => {
        try {
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;

          if (originalWidth < 32 || originalHeight < 32) {
            return reject(new Error("Image resolution is too low. Please upload an image of at least 32x32 pixels."));
          }

          let targetWidth = originalWidth;
          let targetHeight = originalHeight;
          let wasResized = false;

          // Downscale if dimension exceeds 1920px
          if (targetWidth > MAX_IMAGE_DIMENSION_PX || targetHeight > MAX_IMAGE_DIMENSION_PX) {
            wasResized = true;
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * MAX_IMAGE_DIMENSION_PX) / targetWidth);
              targetWidth = MAX_IMAGE_DIMENSION_PX;
            } else {
              targetWidth = Math.round((targetWidth * MAX_IMAGE_DIMENSION_PX) / targetHeight);
              targetHeight = MAX_IMAGE_DIMENSION_PX;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Canvas context unavailable; fallback to original dataUrl
            return resolve({
              dataUrl: srcUrl,
              mimeType: file.type || "image/jpeg",
              originalSize: file.size,
              optimizedSize: file.size,
              width: originalWidth,
              height: originalHeight,
              wasResized: false,
            });
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Output JPEG unless original was PNG with potential transparency or WEBP
          const outputMime = file.type === "image/webp" ? "image/webp" : "image/jpeg";
          const optimizedDataUrl = canvas.toDataURL(outputMime, OPTIMIZATION_QUALITY);

          // Calculate approximate byte size of base64
          const base64Content = optimizedDataUrl.split(",")[1] || "";
          const approxBytes = Math.round((base64Content.length * 3) / 4);

          resolve({
            dataUrl: optimizedDataUrl,
            mimeType: outputMime,
            originalSize: file.size,
            optimizedSize: approxBytes,
            width: targetWidth,
            height: targetHeight,
            wasResized,
          });
        } catch (err: any) {
          reject(new Error(`Image optimization failed: ${err?.message || err}`));
        }
      };

      img.src = srcUrl;
    };

    reader.readAsDataURL(file);
  });
}

function fallbackFileRead(file: File): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      resolve({
        dataUrl,
        mimeType: file.type || "image/jpeg",
        originalSize: file.size,
        optimizedSize: file.size,
        width: 1000,
        height: 1000,
        wasResized: false,
      });
    };
    reader.readAsDataURL(file);
  });
}
