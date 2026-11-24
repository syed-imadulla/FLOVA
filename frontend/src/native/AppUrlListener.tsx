import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App as CapacitorApp, URLOpenListenerEvent } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { getPendingShareToken } from "./sharePlugin";

export function AppUrlListener() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Query any initial pending share token held by native plugin on launch
    void getPendingShareToken().then((pendingToken) => {
      if (pendingToken) {
        navigate(`/catch?sharedToken=${encodeURIComponent(pendingToken)}`);
      }
    });

    // 2. Listen for custom flovaShareIntent dispatched from MainActivity
    const handleShare = (event: Event) => {
      const customEvent = event as CustomEvent<{ token: string }>;
      if (customEvent.detail?.token) {
        navigate(`/catch?sharedToken=${encodeURIComponent(customEvent.detail.token)}`);
      }
    };
    window.addEventListener("flovaShareIntent", handleShare);

    if (!Capacitor.isNativePlatform()) {
      return () => {
        window.removeEventListener("flovaShareIntent", handleShare);
      };
    }

    // 2. Listen for Capacitor appUrlOpen deep links (e.g. from widgets or links)
    const handle = CapacitorApp.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      try {
        const urlStr = event.url;
        let route = "";
        if (urlStr.includes("://")) {
          const parts = urlStr.split("://")[1];
          // e.g. "voice?autoRecord=true" -> "/voice?autoRecord=true"
          route = "/" + parts;
        } else {
          const parsed = new URL(urlStr);
          route = parsed.pathname + parsed.search;
        }

        if (route) {
          navigate(route);
        }
      } catch (err) {
        console.error("Failed to parse appUrlOpen:", err);
      }
    });

    return () => {
      window.removeEventListener("flovaShareIntent", handleShare);
      void handle.then((h) => h.remove());
    };
  }, [navigate]);

  return null;
}
