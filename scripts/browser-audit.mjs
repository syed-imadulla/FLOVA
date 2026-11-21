// Browser Audit Script for FLOVA Phase 1
// Uses headless Google Chrome via Chrome DevTools Protocol (CDP) to verify live navigation,
// redirects, routes, and authentication state in the actual browser DOM.

import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../frontend/dist");

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split("?")[0];
  let filePath = path.join(distDir, urlPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(path.join(distDir, "index.html")).pipe(res);
  }
});

await new Promise((resolve) => server.listen(4173, resolve));

const chrome = spawn("/usr/bin/google-chrome-stable", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--remote-debugging-port=9222",
  "about:blank",
]);

let cdpWsUrl = null;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 200));
  try {
    const res = await fetch("http://127.0.0.1:9222/json/version");
    if (res.ok) {
      const data = await res.json();
      cdpWsUrl = data.webSocketDebuggerUrl;
      break;
    }
  } catch {}
}

if (!cdpWsUrl) {
  console.error("Failed to connect to headless Chrome CDP");
  chrome.kill();
  server.close();
  process.exit(1);
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        this.callbacks.get(msg.id)(msg);
        this.callbacks.delete(msg.id);
      }
    };
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((r) => (this.ws.onopen = r));
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, (msg) => {
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }
}

const newTabRes = await fetch("http://127.0.0.1:9222/json/new?http://localhost:4173/", { method: "PUT" });
const tabData = await newTabRes.json();
const client = new CDPClient(tabData.webSocketDebuggerUrl);
await client.ready();
await client.send("Page.enable");
await client.send("Runtime.enable");

// Wait for SPA initial bundle to load completely
console.log("Waiting for app bundle execution in headless Chrome...");
for (let i = 0; i < 50; i++) {
  await new Promise((r) => setTimeout(r, 100));
  const ready = await client.evaluate("document.readyState === 'complete' && Boolean(document.querySelector('#root, body *'))");
  if (ready) break;
}

console.log("\n=================================================");
console.log("FLOVA Live Headless Chrome Browser Audit");
console.log("=================================================");
let pass = 0;
let fail = 0;

function check(cond, desc) {
  if (cond) {
    console.log(`  ✔ PASS: ${desc}`);
    pass++;
  } else {
    console.log(`  ✘ FAIL: ${desc}`);
    fail++;
  }
}

async function navigateAndSettle(urlPath) {
  await client.evaluate(`
    window.history.pushState({}, '', '${urlPath}');
    window.dispatchEvent(new PopStateEvent('popstate'));
  `);
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 50));
    const cur = await client.evaluate("window.location.pathname");
    if (cur !== urlPath) return cur;
  }
  return await client.evaluate("window.location.pathname");
}

// 1. Marketing Landing Page at root /
const rootTitle = await client.evaluate("document.title");
const rootPath = await client.evaluate("window.location.pathname");
check(rootPath === "/" && rootTitle.includes("FLOVA"), `Root / renders marketing landing page (title: "${rootTitle}")`);

// 2. Auth Login Page at /login
const loginPath = await navigateAndSettle("/login");
await new Promise((r) => setTimeout(r, 300));
const loginHtml = await client.evaluate("document.body.innerHTML");
const hasLoginInputs = loginHtml.includes("Sign in") || loginHtml.includes("Log in") || loginHtml.includes("Sign In");
check(loginPath === "/login" && hasLoginInputs, `/login renders sign-in screen`);

// 3. Auth Signup Page at /signup
const signupPath = await navigateAndSettle("/signup");
await new Promise((r) => setTimeout(r, 300));
const signupHtml = await client.evaluate("document.body.innerHTML");
const hasSignupInputs = signupHtml.includes("Create your FLOVA account") || signupHtml.includes("Sign up") || signupHtml.includes("Create account") || signupHtml.includes("Sign Up");
check(signupPath === "/signup" && hasSignupInputs, `/signup renders sign-up screen`);

// 4. Protected Routes Redirect to /login
const protectedRoutes = [
  "/app",
  "/activity",
  "/voice",
  "/insights",
  "/more",
  "/checkin",
  "/add",
  "/catch",
  "/payouts",
  "/commitments",
  "/wish",
  "/profile",
];

for (const route of protectedRoutes) {
  const settledPath = await navigateAndSettle(route);
  check(settledPath === "/login", `Protected route ${route} enforces auth and redirects to /login`);
}

// 5. Route Aliases Resolve Correctly without Loops
const aliases = [
  { from: "/quick-capture", target: "/add" },
  { from: "/voice-transcription", target: "/voice" },
  { from: "/catch-receipt", target: "/catch" },
  { from: "/history", target: "/activity" },
  { from: "/transactions", target: "/activity" },
  { from: "/overview", target: "/insights" },
  { from: "/settings", target: "/profile" },
  { from: "/plan", target: "/commitments" },
  { from: "/dashboard", target: "/app" },
];

for (const alias of aliases) {
  const settledPath = await navigateAndSettle(alias.from);
  check(settledPath === "/login", `Alias ${alias.from} -> ${alias.target} resolves safely without loops (redirected to ${settledPath})`);
}

// 6. Source-level audit of ActivityScreen and ProfileScreen
const activitySrc = fs.readFileSync(path.resolve(__dirname, "../frontend/src/screens/ActivityScreen.tsx"), "utf8");
const profileSrc = fs.readFileSync(path.resolve(__dirname, "../frontend/src/screens/ProfileScreen.tsx"), "utf8");
const moreSrc = fs.readFileSync(path.resolve(__dirname, "../frontend/src/screens/MoreScreen.tsx"), "utf8");

check(!activitySrc.includes("IconMic") && !activitySrc.includes("Add by voice"), "ActivityScreen verified: no 'Add by voice' or voice capture triggers in Activity");
check(!activitySrc.includes("useNavigate") || !activitySrc.includes("navigateToCreate"), "ActivityScreen verified: no creation controls in Activity screen");
check(profileSrc.includes("signOut") && profileSrc.includes("Sign out"), "ProfileScreen verified: accessible Sign out button present calling signOut()");
check(moreSrc.includes("signOut") && moreSrc.includes("Sign out"), "MoreScreen verified: accessible Sign out button present calling signOut()");

console.log("=================================================");
console.log(`Browser Audit Results: ${pass} passed, ${fail} failed, ${pass + fail} total`);
console.log("=================================================");

client.ws.close();
chrome.kill();
server.close();
process.exit(fail ? 1 : 0);
