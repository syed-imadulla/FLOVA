// =====================================================================
// Android shell (Capacitor) invariants: back-button behaviour, manifest
// permissions and backup policy, and the package ID.
// =====================================================================
// @ts-ignore
import fs from "node:fs";
// @ts-ignore
import path from "node:path";
// @ts-ignore
import { fileURLToPath } from "node:url";
import { backAction, EXIT_PATHS } from "../../native/backAction";

declare const process: any;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf-8");

let passed = 0, failed = 0;
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ✔ ${name}`); } catch (e) { failed++; console.error(`  ✖ ${name}: ${(e as Error).message}`); }
}
function assert(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

test("back goes through in-app history when there is history", () => {
  assert(backAction("/add", true) === "history", "/add with history");
  assert(backAction("/app", true) === "history", "/app with history");
});

test("back with no history exits only from top-level screens", () => {
  for (const p of EXIT_PATHS) assert(backAction(p, false) === "exit", `${p} should exit`);
  assert(backAction("/checkin", false) === "home", "/checkin should go home, not exit");
  assert(backAction("/invoices", false) === "home", "/invoices should go home, not exit");
});

const manifest = read("android/app/src/main/AndroidManifest.xml");

test("manifest declares microphone permission for voice capture", () => {
  assert(manifest.includes('android.permission.RECORD_AUDIO"'), "RECORD_AUDIO missing");
});

test("manifest does not declare CAMERA (would block the FileProvider camera intent)", () => {
  assert(!/<uses-permission[^>]*android\.permission\.CAMERA"/.test(manifest), "CAMERA must not be declared");
  assert(manifest.includes("androidx.core.content.FileProvider"), "FileProvider missing");
});

test("app data is excluded from Android backup and device transfer", () => {
  assert(manifest.includes('android:allowBackup="false"'), "allowBackup must be false");
  assert(manifest.includes('android:dataExtractionRules="@xml/data_extraction_rules"'), "dataExtractionRules missing");
  const rules = read("android/app/src/main/res/xml/data_extraction_rules.xml");
  assert(/<cloud-backup>[\s\S]*domain="root"[\s\S]*<\/cloud-backup>/.test(rules), "cloud-backup must exclude root");
  assert(/<device-transfer>[\s\S]*domain="root"[\s\S]*<\/device-transfer>/.test(rules), "device-transfer must exclude root");
});

test("package ID is in.flova.app everywhere", () => {
  assert(read("capacitor.config.ts").includes("appId: 'in.flova.app'"), "capacitor.config.ts appId");
  const gradle = read("android/app/build.gradle");
  assert(gradle.includes('applicationId "in.flova.app"'), "applicationId");
  assert(gradle.includes('namespace = "in.flova.app"'), "namespace");
});

test("Android targets API 36 (Google Play requirement)", () => {
  const vars = read("android/variables.gradle");
  assert(/targetSdkVersion = 36\b/.test(vars), "targetSdkVersion must be 36");
});

console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
