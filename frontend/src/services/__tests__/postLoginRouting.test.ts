import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resolvePostLoginDestination, setProfileLoaderForTesting } from "../postLoginRouting";
import type { Profile } from "../../types/contracts";

describe("postLoginRouting Unit & Regression Tests", () => {
  afterEach(() => {
    setProfileLoaderForTesting();
  });

  it("routes new user without profile or on fetch failure to /onboarding", async () => {
    setProfileLoaderForTesting(async () => {
      throw new Error("PGRST116: JSON object requested, multiple (or no) rows returned");
    });

    const dest = await resolvePostLoginDestination("/app");
    assert.equal(dest, "/onboarding");
  });

  it("routes existing user with incomplete onboarding (onboarding_completed: false) to /onboarding", async () => {
    setProfileLoaderForTesting(async () => ({
      id: "test-user-incomplete",
      display_name: "Incomplete User",
      work_profile: "other",
      payout_pattern: "weekly",
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile));

    const dest = await resolvePostLoginDestination();
    assert.equal(dest, "/onboarding");

    // Even if user originally hit /app, if onboarding is incomplete, must go to /onboarding
    const destWithFrom = await resolvePostLoginDestination("/app");
    assert.equal(destWithFrom, "/onboarding");
  });

  it("routes existing user with completed onboarding (onboarding_completed: true) to /app", async () => {
    setProfileLoaderForTesting(async () => ({
      id: "test-user-complete",
      display_name: "Complete User",
      work_profile: "delivery",
      payout_pattern: "daily",
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile));

    const dest = await resolvePostLoginDestination();
    assert.equal(dest, "/app");
  });

  it("never routes to /profile or /settings as default destination, falling back to /app", async () => {
    setProfileLoaderForTesting(async () => ({
      id: "test-user-complete",
      display_name: "Complete User",
      work_profile: "delivery",
      payout_pattern: "daily",
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile));

    // If "from" was /settings or /profile, it must default back to /app
    const destSettings = await resolvePostLoginDestination("/settings");
    assert.equal(destSettings, "/app");

    const destProfile = await resolvePostLoginDestination("/profile");
    assert.equal(destProfile, "/app");

    const destLogin = await resolvePostLoginDestination("/login");
    assert.equal(destLogin, "/app");
  });

  it("preserves legitimate deep screen destinations for completed users", async () => {
    setProfileLoaderForTesting(async () => ({
      id: "test-user-complete",
      display_name: "Complete User",
      work_profile: "delivery",
      payout_pattern: "daily",
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile));

    const destActivity = await resolvePostLoginDestination("/activity");
    assert.equal(destActivity, "/activity");

    const destVoice = await resolvePostLoginDestination("/voice");
    assert.equal(destVoice, "/voice");
  });
});
