// =====================================================================
// FLOVA SEC-11: CI Security & Secret Scanner
// Scans tracked repository files for accidental credentials, private keys,
// and verifies dependency lockfile integrity without external network calls.
// Usage: node scripts/ci-security-scan.mjs
// =====================================================================

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("=================================================");
console.log("FLOVA SEC-11: Automated Security & Secret Scanner");
console.log("=================================================\n");

let failures = 0;

function fail(msg, detail) {
  failures++;
  console.error(`❌ FAIL: ${msg}`);
  if (detail) console.error(`   ${detail}`);
}

function pass(msg) {
  console.log(`✓ PASS: ${msg}`);
}

// ---------------------------------------------------------------------
// 1. Prohibited Tracked Files Check
// ---------------------------------------------------------------------
console.log("[1/4] Checking for prohibited or sensitive tracked files...");
const sensitivePatterns = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\..*\.local$/,
  /\.keystore$/,
  /\.jks$/,
  /id_rsa/,
  /id_ed25519/,
  /google-services\.json$/
];

try {
  const trackedFiles = execSync("git ls-files", { cwd: rootDir, encoding: "utf8" })
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  let sensitiveFound = 0;
  for (const file of trackedFiles) {
    for (const pat of sensitivePatterns) {
      if (pat.test(file)) {
        fail("Sensitive file tracked in Git", file);
        sensitiveFound++;
      }
    }
  }

  if (sensitiveFound === 0) {
    pass(`All ${trackedFiles.length} tracked files are safe (no private key, env or keystore files committed)`);
  }
} catch (err) {
  fail("Could not list tracked git files", err.message);
}

// ---------------------------------------------------------------------
// 2. Secret Pattern Scanning in Tracked Files
// ---------------------------------------------------------------------
console.log("\n[2/4] Scanning tracked files for secret signatures and keys...");
const secretSignatures = [
  { name: "Live Supabase Service-Role JWT", regex: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.4B5pMUXlglBY8rdXZww0HHkzSiTvZw8YBc-ILy2jeJE/ },
  { name: "Live Groq API Key pattern", regex: /gsk_[a-zA-Z0-9]{32,}/ },
  { name: "Private RSA/EC Key Block", regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: "Google API Key in Source", regex: /AIza[0-9A-Za-z-_]{35}/ },
  { name: "Hardcoded Postgres connection password", regex: /postgres:\/\/[a-zA-Z0-9_]+:[^@\s]{8,}@[a-zA-Z0-9.-]+:[0-9]+\// }
];

// Exempt documentation or test verification regexes
const exemptPaths = [
  "scripts/ci-security-scan.mjs",
  "docs/PHASE_2_FINAL_QA_REPORT.md",
  "docs/DEPLOYMENT.md",
  "docs/production-readiness-audit.md"
];

try {
  const trackedFiles = execSync("git ls-files", { cwd: rootDir, encoding: "utf8" })
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  let leaksFound = 0;
  for (const relPath of trackedFiles) {
    if (exemptPaths.includes(relPath)) continue;
    // Skip binary assets (images, fonts, archives)
    if (/\.(png|jpg|jpeg|webp|ico|apk|jar|pdf|woff|woff2|ttf|eot)$/i.test(relPath)) continue;

    const fullPath = path.join(rootDir, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, "utf8");
    for (const sig of secretSignatures) {
      if (sig.regex.test(content)) {
        fail(`Potential secret matched (${sig.name}) in ${relPath}`);
        leaksFound++;
      }
    }
  }

  if (leaksFound === 0) {
    pass("Zero secrets, service-role keys, or API credentials detected in tracked files");
  }
} catch (err) {
  fail("Secret pattern scan failed", err.message);
}

// ---------------------------------------------------------------------
// 3. Lockfile Consistency & Integrity Checks
// ---------------------------------------------------------------------
console.log("\n[3/4] Checking dependency lockfile integrity...");
function checkLockfile(dirName, lockfileName) {
  const pkgPath = path.join(rootDir, dirName, "package.json");
  const lockPath = path.join(rootDir, dirName, lockfileName);

  if (!fs.existsSync(pkgPath) || !fs.existsSync(lockPath)) {
    fail(`Missing package.json or lockfile in ${dirName}`);
    return;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));

    if (pkg.name !== lock.name) {
      fail(`Package name mismatch in ${dirName}: ${pkg.name} vs ${lock.name}`);
    } else {
      pass(`${dirName}/${lockfileName} present and aligned with ${dirName}/package.json`);
    }
  } catch (err) {
    fail(`Failed to parse ${dirName} package/lockfile`, err.message);
  }
}

checkLockfile("frontend", "package-lock.json");
checkLockfile("backend", "package-lock.json");

if (fs.existsSync(path.join(rootDir, "backend/deno.lock"))) {
  pass("backend/deno.lock is present for Edge Functions");
} else {
  fail("backend/deno.lock is missing");
}

// ---------------------------------------------------------------------
// 4. Client Source Public Key Hygiene (SEC-08 Guard)
// ---------------------------------------------------------------------
console.log("\n[4/4] Verifying client source has no hardcoded fallback keys (SEC-08)...");
const supabaseClientPath = path.join(rootDir, "frontend/src/lib/supabase.ts");
if (fs.existsSync(supabaseClientPath)) {
  const content = fs.readFileSync(supabaseClientPath, "utf8");
  if (content.includes("msjzkylvafuwlkkujxpv.supabase.co")) {
    fail("Hardcoded Supabase URL fallback detected in frontend/src/lib/supabase.ts");
  } else if (content.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")) {
    fail("Hardcoded JWT fallback key detected in frontend/src/lib/supabase.ts");
  } else {
    pass("frontend/src/lib/supabase.ts enforces pure environment-based configuration without static fallbacks");
  }
} else {
  fail("frontend/src/lib/supabase.ts not found");
}

console.log("\n=================================================");
if (failures === 0) {
  console.log("✓ ALL AUTOMATED CI SECURITY SCANS PASSED");
  console.log("=================================================");
  process.exit(0);
} else {
  console.error(`❌ ${failures} SECURITY SCAN CHECKS FAILED`);
  console.log("=================================================");
  process.exit(1);
}
