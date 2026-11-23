import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import { initInstallPrompt } from "./pwa/installPrompt";
import { initSocialLogin } from "./services/socialAuth";

registerServiceWorker();
initInstallPrompt();
void initSocialLogin();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
