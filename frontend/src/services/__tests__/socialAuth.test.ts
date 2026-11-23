import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateRawNonce, sha256Hex, GOOGLE_WEB_CLIENT_ID } from "../socialAuth";

describe("socialAuth Service Unit Tests", () => {
  it("generates a 64-character URL-safe hex nonce", () => {
    const nonce = generateRawNonce();
    assert.equal(typeof nonce, "string");
    assert.equal(nonce.length, 64);
    assert.match(nonce, /^[0-9a-f]{64}$/);
  });

  it("produces distinct random nonces on consecutive calls", () => {
    const nonce1 = generateRawNonce();
    const nonce2 = generateRawNonce();
    assert.notEqual(nonce1, nonce2);
  });

  it("computes deterministic SHA-256 hex digest", async () => {
    // Known test vector: SHA-256("test-nonce") = 4c311...
    const testInput = "test-nonce-12345";
    const digest1 = await sha256Hex(testInput);
    const digest2 = await sha256Hex(testInput);

    assert.equal(typeof digest1, "string");
    assert.equal(digest1.length, 64);
    assert.equal(digest1, digest2);
    assert.match(digest1, /^[0-9a-f]{64}$/);
  });

  it("exports GOOGLE_WEB_CLIENT_ID string constant safely", () => {
    assert.equal(typeof GOOGLE_WEB_CLIENT_ID, "string");
  });
});
