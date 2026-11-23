import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import { initInstallPrompt } from "./pwa/installPrompt";

registerServiceWorker();
initInstallPrompt();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
