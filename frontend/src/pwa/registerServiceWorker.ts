// Registration helper for FLOVA PWA service worker
import { Capacitor } from "@capacitor/core";

export function registerServiceWorker(): void {
  // The Android app ships its web assets inside the APK; a service worker there would keep serving
  // the cache from an older install after an app update. Register only on the web.
  if (Capacitor.isNativePlatform()) return;
  if (typeof window !== "undefined" && "serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.debug("[FLOVA PWA] Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.debug("[FLOVA PWA] Service Worker registration failed:", err);
        });
    });
  }
}
