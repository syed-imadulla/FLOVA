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
import { isKeyboardOpen, KEYBOARD_MIN_PX } from "../../native/keyboard";

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

test("keyboard is detected by a large height drop, not a toolbar collapse", () => {
  assert(isKeyboardOpen(800, 450), "350 px drop is the keyboard");
  assert(!isKeyboardOpen(800, 740), "60 px drop (browser toolbar) is not the keyboard");
  assert(!isKeyboardOpen(800, 800 - KEYBOARD_MIN_PX), "exactly the threshold is not the keyboard");
});

test("receipt camera input uses accept=image/* so the Android app opens the camera", () => {
  const catchScreen = read("src/screens/CatchScreen.tsx");
  const cameraInput = catchScreen.match(/ref=\{cameraInputRef\}[\s\S]*?\/>/);
  assert(!!cameraInput, "camera input not found");
  assert(/accept="image\/\*"/.test(cameraInput![0]), "camera input must use accept=\"image/*\" (Capacitor requires it)");
  assert(/capture="environment"/.test(cameraInput![0]), "camera input must keep capture=environment");
});

test("Android launcher icon and splash use FLOVA artwork, not Capacitor defaults", () => {
  const styles = read("android/app/src/main/res/values/styles.xml");
  assert(styles.includes("windowSplashScreenAnimatedIcon"), "Android 12+ splash icon not set");
  assert(styles.includes("@color/flova_splash_background"), "splash background colour not set");
  // FLOVA PNGs are generated from frontend/assets; the Capacitor default foreground is ~a few KB of blue.
  for (const d of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
    assert(fs.existsSync(path.join(root, `android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`)), `${d} foreground missing`);
  }
  assert(fs.existsSync(path.join(root, "assets/icon-foreground.png")), "icon source missing");
});

console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) process.exit(1);
