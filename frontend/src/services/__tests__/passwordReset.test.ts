// =====================================================================
// FLOVA SEC-10: Secure Password Recovery & Redirect Validation Tests
// =====================================================================

import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedRedirectOrigin,
  getSafePasswordResetRedirectUrl,
  requestPasswordReset,
  updatePassword,
} from "../auth";
import { mockState, resetMockState } from "./mockSupabase";

test("Password Recovery & Redirect Security Suite", async (t) => {
  t.beforeEach(() => {
    resetMockState();
  });

  await t.test("1. Validates allowed application redirect origins", () => {
    // Valid production and local origins
    assert.equal(isAllowedRedirectOrigin("https://myflova.vercel.app/reset-password"), true);
    assert.equal(isAllowedRedirectOrigin("http://localhost:5173/reset-password"), true);
    assert.equal(isAllowedRedirectOrigin("http://127.0.0.1:5173/reset-password"), true);
    assert.equal(isAllowedRedirectOrigin("capacitor://localhost/reset-password"), true);
    assert.equal(isAllowedRedirectOrigin("in.flova.app://reset-password"), true);

    // Reject malicious, open-redirect, or third-party origins (CWE-601 defense)
    assert.equal(isAllowedRedirectOrigin("https://evil-phishing-site.com/reset"), false);
    assert.equal(isAllowedRedirectOrigin("https://myflova.vercel.app.attacker.com"), false);
    assert.equal(isAllowedRedirectOrigin("evil.app://reset-password"), false);
    assert.equal(isAllowedRedirectOrigin("in.flova.app://evil-phishing"), false);
    assert.equal(isAllowedRedirectOrigin("javascript:alert(1)"), false);
    assert.equal(isAllowedRedirectOrigin(""), false);
    assert.equal(isAllowedRedirectOrigin(null as unknown as string), false);
  });

  await t.test("2. Fallback redirect URL defaults to verified origin", () => {
    const url = getSafePasswordResetRedirectUrl();
    assert.match(url, /\/reset-password$/);
    assert.equal(isAllowedRedirectOrigin(url), true);
  });

  await t.test("3. requestPasswordReset rejects empty or malformed email", async () => {
    await assert.rejects(
      async () => requestPasswordReset(""),
      /Please enter a valid email address/
    );
    await assert.rejects(
      async () => requestPasswordReset("notanemail"),
      /Please enter a valid email address/
    );
  });

  await t.test("4. requestPasswordReset sanitizes unauthorized custom redirect URLs", async () => {
    let capturedOptions: any = null;
    mockState.resetPasswordHandler = async (_email: string, options: any) => {
      capturedOptions = options;
      return { data: {}, error: null };
    };

    // Attacker tries to pass custom redirect to evil site
    const res = await requestPasswordReset("rider@partner.com", "https://evil-phishing.com/steal");

    assert.equal(res.success, true);
    // Verified: custom evil redirect was rejected and replaced with safe application redirect
    assert.match(capturedOptions.redirectTo, /\/reset-password$/);
    assert.equal(isAllowedRedirectOrigin(capturedOptions.redirectTo), true);
    assert.doesNotMatch(capturedOptions.redirectTo, /evil-phishing/);
  });

  await t.test("5. requestPasswordReset preserves authorized custom redirect URLs", async () => {
    let capturedOptions: any = null;
    mockState.resetPasswordHandler = async (_email: string, options: any) => {
      capturedOptions = options;
      return { data: {}, error: null };
    };

    const res = await requestPasswordReset("rider@partner.com", "https://myflova.vercel.app/reset-password");
    assert.equal(res.success, true);
    assert.equal(capturedOptions.redirectTo, "https://myflova.vercel.app/reset-password");
  });

  await t.test("6. Anti-enumeration defense: returns neutral message regardless of user existence", async () => {
    // Case A: Supabase returns success
    mockState.resetPasswordHandler = async () => ({ data: {}, error: null });
    const resA = await requestPasswordReset("exists@flova.local");
    assert.match(resA.message, /If an account exists for this email/);

    // Case B: Supabase returns generic user-not-found error internally
    mockState.resetPasswordHandler = async () => ({
      data: null,
      error: { message: "User not found", status: 400 },
    });
    const resB = await requestPasswordReset("does-not-exist@flova.local");
    assert.equal(resB.success, true);
    // Neutral message presented; does not disclose non-existence to caller
    assert.match(resB.message, /If an account exists for this email/);
  });

  await t.test("7. Surfaces rate-limiting (HTTP 429) clearly to mitigate brute force", async () => {
    mockState.resetPasswordHandler = async () => ({
      data: null,
      error: { message: "Email rate limit exceeded", status: 429 },
    });

    await assert.rejects(
      async () => requestPasswordReset("spammer@flova.local"),
      /Too many password reset requests/
    );
  });

  await t.test("8. updatePassword enforces minimum 8 characters", async () => {
    await assert.rejects(
      async () => updatePassword("short"),
      /Password must be at least 8 characters long/
    );
    await assert.rejects(
      async () => updatePassword(""),
      /Password must be at least 8 characters long/
    );
  });

  await t.test("9. updatePassword executes successfully with valid password", async () => {
    let updatedAttributes: any = null;
    mockState.updateUserHandler = async (attrs: any) => {
      updatedAttributes = attrs;
      return { data: { user: { id: "test-user-id" } }, error: null };
    };

    await updatePassword("StrongNewPassword2026!");
    assert.equal(updatedAttributes.password, "StrongNewPassword2026!");
  });

  await t.test("10. updatePassword handles expired or invalid recovery token error", async () => {
    mockState.updateUserHandler = async () => ({
      data: null,
      error: { message: "Auth session missing or recovery token expired", status: 401 },
    });

    await assert.rejects(
      async () => updatePassword("StrongNewPassword2026!"),
      /Password update failed: Auth session missing or recovery token expired/
    );
  });
});
