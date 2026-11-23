// Android hardware/gesture back inside the Capacitor app.
// Goes back through in-app history; on a top-level screen with no history it exits the app
// instead of leaving the user on a blank WebView. Does nothing on the web.
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { backAction } from "./backAction";

export function AndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    const handle = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      const action = backAction(pathRef.current, canGoBack);
      if (action === "history") window.history.back();
      else if (action === "exit") void CapacitorApp.exitApp();
      else navigate("/app", { replace: true });
    });
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [navigate]);

  return null;
}
