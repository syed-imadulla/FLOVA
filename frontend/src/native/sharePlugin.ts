import { registerPlugin, Capacitor } from "@capacitor/core";

export interface ClaimPayloadResult {
  status: "ok" | "not_found" | "expired" | "already_claimed";
  claimId?: string;
  payload?: {
    type: "text" | "image";
    textContent?: string;
    imagePath?: string;
  };
}

export interface RenewLeaseResult {
  status: "ok" | "not_found" | "expired" | "lease_lost";
}

export interface AcknowledgeResult {
  status: "ok" | "not_found" | "lease_lost";
}

export interface FlovaSharePluginInterface {
  claimSharedPayload(options: { token: string; clientClaimId?: string }): Promise<ClaimPayloadResult>;
  renewSharedPayloadLease(options: { token: string; claimId: string }): Promise<RenewLeaseResult>;
  acknowledgeSharedPayload(options: { token: string; claimId: string }): Promise<AcknowledgeResult>;
  getPendingShareToken(): Promise<{ token?: string | null }>;
}

export const FlovaShareNative = registerPlugin<FlovaSharePluginInterface>("FlovaSharePlugin");

/**
 * High-level TypeScript client for claiming and consuming native shared content.
 * Converts native private file paths to Capacitor WebView asset URLs.
 */
export async function claimAndResolveShare(
  token: string,
  preferredClaimId?: string
): Promise<{
  claimId: string;
  type: "text" | "image";
  text?: string;
  imageUrl?: string;
} | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const res = await FlovaShareNative.claimSharedPayload({
      token,
      clientClaimId: preferredClaimId,
    });

    if (res.status !== "ok" || !res.payload || !res.claimId) {
      console.warn("Native claim returned non-ok status:", res.status);
      return null;
    }

    if (res.payload.type === "text") {
      return {
        claimId: res.claimId,
        type: "text",
        text: res.payload.textContent,
      };
    }

    if (res.payload.type === "image" && res.payload.imagePath) {
      const convertedUrl = Capacitor.convertFileSrc(res.payload.imagePath);
      return {
        claimId: res.claimId,
        type: "image",
        imageUrl: convertedUrl,
      };
    }
  } catch (err) {
    console.error("Error claiming native shared payload:", err);
  }

  return null;
}

/**
 * Renews the active lease heartbeat.
 */
export async function renewShareLease(token: string, claimId: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await FlovaShareNative.renewSharedPayloadLease({ token, claimId });
    return res.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Acknowledges successful consumption and triggers native disk cleanup.
 */
export async function acknowledgeShare(token: string, claimId: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await FlovaShareNative.acknowledgeSharedPayload({ token, claimId });
    return res.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Retrieves initial pending share token held by native plugin on launch.
 */
export async function getPendingShareToken(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const res = await FlovaShareNative.getPendingShareToken();
    return res?.token || null;
  } catch {
    return null;
  }
}
