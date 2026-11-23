// =====================================================================
// App entry and install: the landing page is website-only, the Android app
// and installed PWA start in the app, and the website offers "Install app".
// =====================================================================
// @ts-ignore
import fs from "node:fs";
// @ts-ignore
import path from "node:path";
// @ts-ignore
import { fileURLToPath } from "node:url";
import { installState, isIOS } from "../../pwa/installPrompt";

declare const process: any;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf-8");

let passed = 0, failed = 0;
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ✔ ${name}`); } catch (e) { failed++; console.error(`  ✖ ${name}: ${(e as Error).message}`); }
}
function assert(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

test("install offer matches browser capability", () => {
  assert(installState({ standalone: true, installed: false, canPrompt: true, ios: false }) === "installed", "standalone → installed");
  assert(installState({ standalone: false, installed: true, canPrompt: false, ios: false }) === "installed", "appinstalled → installed");
  assert(installState({ standalone: false, installed: false, canPrompt: true, ios: false }) === "prompt", "Chrome prompt → button");
  assert(installState({ standalone: false, installed: false, canPrompt: false, ios: true }) === "ios", "iPhone → Share steps");
  assert(installState({ standalone: false, installed: false, canPrompt: false, ios: false }) === "manual", "other → menu steps");
});

test("iOS detection", () => {
  assert(isIOS("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari"), "iPhone");
  assert(!isIOS("Mozilla/5.0 (Linux; Android 15; 23076RN4BI) Chrome/157 Mobile"), "Android is not iOS");
});

test("landing page is website-only; the Android app starts at login", () => {
  const app = read("src/App.tsx");
  assert(/path="\/"\s+element=\{IS_NATIVE_APP \? <Navigate to=\{APP_START_PATH\} replace \/> : <FlovaLandingPage \/>\}/.test(app), "/ must redirect in the native app");
  assert(read("src/native/platform.ts").includes('APP_START_PATH = "/login"'), "app start must be /login");
  for (const p of ["src/pages/auth/LoginPage.tsx", "src/pages/auth/SignupPage.tsx"]) {
    assert(/\{!IS_NATIVE_APP && \([\s\S]*Return to FLOVA Home/.test(read(p)), `${p}: home link must be hidden in the app`);
  }
});

test("installed website app opens the app, not the landing page", () => {
  const m = JSON.parse(read("public/manifest.webmanifest"));
  assert(m.start_url === "/app", "start_url must be /app");
  assert(m.display === "standalone", "display standalone");
  const maskable = m.icons.filter((i: any) => i.purpose === "maskable");
  assert(maskable.length >= 2 && maskable.every((i: any) => /icon-maskable-\d+\.png$/.test(i.src)), "dedicated maskable icons");
  for (const i of maskable) assert(fs.existsSync(path.join(root, "public", i.src)), `${i.src} missing`);
  assert(m.share_target?.action === "/share-target", "share target kept");
});

test("landing page offers Install app", () => {
  assert(read("src/components/landing/FlovaLandingPage.tsx").includes("<FlovaInstallApp />"), "install section missing");
  assert(read("src/components/landing/FlovaNavbar.tsx").includes('{ id: "install", label: "Install app" }'), "navbar link missing");
  assert(read("src/main.tsx").includes("initInstallPrompt();"), "beforeinstallprompt must be captured at startup");
});

console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
