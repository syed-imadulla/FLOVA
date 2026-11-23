// "Install app" support for the website (PWA).
// Chrome/Edge/Samsung Internet fire `beforeinstallprompt` once, often before the landing page
// renders, so it is captured at startup and kept until the user taps "Install".
// iPhone Safari has no prompt: users add FLOVA from the Share menu instead.
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function initInstallPrompt(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // show our own button instead of the browser's mini-infobar
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(userAgent: string = typeof navigator === "undefined" ? "" : navigator.userAgent): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/.test(userAgent) && /Mobile/.test(userAgent));
}

export type InstallState = "installed" | "prompt" | "ios" | "manual";

/** What the install section should offer, given the browser's capabilities. */
export function installState(opts: { standalone: boolean; installed: boolean; canPrompt: boolean; ios: boolean }): InstallState {
  if (opts.standalone || opts.installed) return "installed";
  if (opts.canPrompt) return "prompt";
  if (opts.ios) return "ios";
  return "manual";
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const event = deferred;
  deferred = null; // the event can be used only once
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") installed = true;
  notify();
  return outcome;
}

export function useInstallState(): InstallState {
  const compute = () => installState({ standalone: isStandalone(), installed, canPrompt: deferred !== null, ios: isIOS() });
  const [state, setState] = useState<InstallState>(compute);
  useEffect(() => {
    const update = () => setState(compute());
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);
  return state;
}
