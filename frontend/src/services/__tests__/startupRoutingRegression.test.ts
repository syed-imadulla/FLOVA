import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resolvePostLoginDestination, setProfileLoaderForTesting } from "../postLoginRouting";
import type { Profile } from "../../types/contracts";

describe("Startup Routing & Onboarding State Regression Tests", () => {
  afterEach(() => {
    setProfileLoaderForTesting();
  });

  it("1. First-time user without profile or onboarding_completed: false routes to /onboarding", async () => {
    setProfileLoaderForTesting(async () => ({
      id: "first-time-user-id",
      display_name: null,
      work_profile: "other",
      payout_pattern: "weekly",
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile));

    const destination = await resolvePostLoginDestination();
    assert.equal(destination, "/onboarding", "First-time user must be routed to /onboarding");
  });

  it("2. Completed onboarding + authenticated user opens Home (/app)", async () => {
    setProfileLoaderForTesting(async () => ({
      id: "existing-onboarded-user-id",
      display_name: "Ravi Kumar",
      work_profile: "delivery",
      payout_pattern: "daily",
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile));

    const destination = await resolvePostLoginDestination();
    assert.equal(destination, "/app", "Onboarded user must land directly on /app (Home/Dashboard)");
  });

  it("3. App restart / returning user with completed onboarding does NOT show onboarding", async () => {
    setProfileLoaderForTesting(async () => ({
      id: "restarted-session-user",
      display_name: "Returning Delivery Partner",
      work_profile: "delivery",
      payout_pattern: "weekly",
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile));

    // When native app starts at /login (APP_START_PATH), destination must resolve to /app
    const restartDestination = await resolvePostLoginDestination("/login");
    assert.equal(restartDestination, "/app", "App restart must route directly to /app, not /onboarding");

    const rootDestination = await resolvePostLoginDestination("/");
    assert.equal(rootDestination, "/app", "App start at root must route directly to /app");
  });

  it("4. Delayed session restoration does not trigger premature onboarding", async () => {
    let loaderInvoked = false;
    setProfileLoaderForTesting(async () => {
      // Simulate network / storage latency for session and profile restoration
      await new Promise((res) => setTimeout(res, 50));
      loaderInvoked = true;
      return {
        id: "delayed-session-user",
        display_name: "Delayed Partner",
        work_profile: "driver",
        payout_pattern: "daily",
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Profile;
    });

    const destination = await resolvePostLoginDestination("/app");
    assert.equal(loaderInvoked, true, "Loader must have been invoked and awaited");
    assert.equal(destination, "/app", "Delayed session restoration must accurately resolve to /app");
  });

  it("5. Deep link destinations are preserved for completed onboarding users", async () => {
    setProfileLoaderForTesting(async () => ({
      id: "deep-link-user",
      display_name: "Deep Link User",
      work_profile: "freelancer",
      payout_pattern: "weekly",
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile));

    const activityDest = await resolvePostLoginDestination("/activity");
    assert.equal(activityDest, "/activity", "Should preserve /activity destination");

    const payoutsDest = await resolvePostLoginDestination("/payouts");
    assert.equal(payoutsDest, "/payouts", "Should preserve /payouts destination");

    const catchDest = await resolvePostLoginDestination("/catch");
    assert.equal(catchDest, "/catch", "Should preserve /catch destination");
  });

  it("6. Auth screens (/login, /signup, /settings, /profile) fallback to /app for completed users", async () => {
    setProfileLoaderForTesting(async () => ({
      id: "redirect-guard-user",
      display_name: "Guard User",
      work_profile: "delivery",
      payout_pattern: "daily",
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile));

    assert.equal(await resolvePostLoginDestination("/login"), "/app");
    assert.equal(await resolvePostLoginDestination("/signup"), "/app");
    assert.equal(await resolvePostLoginDestination("/profile"), "/app");
    assert.equal(await resolvePostLoginDestination("/settings"), "/app");
  });
});
