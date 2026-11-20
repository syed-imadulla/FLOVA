// Registration helper for FLOVA PWA service worker
export function registerServiceWorker(): void {
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
