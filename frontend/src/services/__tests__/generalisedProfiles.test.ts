import { updateMyProfile } from "../data";
import { mockState } from "./mockSupabase";
import {
  WORK_PROFILES,
  INCOME_VARIABILITIES,
  OCCUPATION_WORK_CATEGORIES,
  UNIVERSAL_LIVING_CATEGORIES,
  type WorkProfile,
  type IncomeVariability,
} from "../../types/contracts";

let passCount = 0;
let failCount = 0;

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertStrictEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message ?? `Assertion failed: expected ${String(expected)}, but got ${String(actual)}`);
  }
}

function it(name: string, fn: () => Promise<void> | void) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(
        () => {
          passCount++;
          console.log(`  ✔ ${name}`);
        },
        (err) => {
          failCount++;
          console.error(`  ✘ ${name}`);
          console.error(err);
        }
      );
    } else {
      passCount++;
      console.log(`  ✔ ${name}`);
    }
  } catch (err) {
    failCount++;
    console.error(`  ✘ ${name}`);
    console.error(err);
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("FLOVA Generalised Profiles & Income Variability Tests");
  console.log("=================================================\n");

  const userId = "test-user-worker-1";

  // Test 1: Verify all 9 worker profiles exist in contracts and can be updated
  await it("Test 1: All 9 work profiles can be saved cleanly", async () => {
    assertStrictEqual(WORK_PROFILES.length, 9, "Must support exactly 9 work profiles");
    const expected = [
      "delivery",
      "driver",
      "service",
      "freelancer",
      "independent_business",
      "small_vendor",
      "daily_wage",
      "seasonal_worker",
      "other",
    ];
    for (const exp of expected) {
      assertTrue(WORK_PROFILES.includes(exp as WorkProfile), `Profile ${exp} must be present`);
    }

    for (const wp of WORK_PROFILES) {
      mockState.insertHandler = async () => ({
        data: {
          id: userId,
          display_name: "Worker Test",
          work_profile: wp,
          payout_pattern: "weekly",
          income_variability: "variable",
          handles_cod: false,
          safe_runway_buffer: null,
          preferred_language: "en",
          daily_living_estimate: "200.00",
          daily_work_estimate: "100.00",
          onboarding_completed: true,
          created_at: "2026-11-21T00:00:00Z",
          updated_at: "2026-11-21T00:00:00Z",
        },
        error: null,
      });

      const updated = await updateMyProfile(userId, { work_profile: wp });
      assertStrictEqual(updated.work_profile, wp);
    }
  });

  // Test 2: Verify all 5 income variability options
  await it("Test 2: All 5 income variability tiers can be saved cleanly", async () => {
    assertStrictEqual(INCOME_VARIABILITIES.length, 5, "Must support exactly 5 income variabilities");
    const expected = ["regular", "variable", "unpredictable", "seasonal", "intermittent"];
    for (const exp of expected) {
      assertTrue(INCOME_VARIABILITIES.includes(exp as IncomeVariability), `Variability ${exp} must be present`);
    }

    for (const iv of INCOME_VARIABILITIES) {
      mockState.insertHandler = async () => ({
        data: {
          id: userId,
          display_name: "Worker Test",
          work_profile: "freelancer",
          payout_pattern: "milestone",
          income_variability: iv,
          handles_cod: false,
          safe_runway_buffer: null,
          preferred_language: "en",
          daily_living_estimate: "300.00",
          daily_work_estimate: "150.00",
          onboarding_completed: true,
          created_at: "2026-11-21T00:00:00Z",
          updated_at: "2026-11-21T00:00:00Z",
        },
        error: null,
      });

      const updated = await updateMyProfile(userId, { income_variability: iv });
      assertStrictEqual(updated.income_variability, iv);
    }
  });

  // Test 3: COD capability toggle & safe runway buffer
  await it("Test 3: Handles COD toggle and safe runway buffer persist properly", async () => {
    mockState.insertHandler = async () => ({
      data: {
        id: userId,
        display_name: "Ramesh Small Vendor",
        work_profile: "small_vendor",
        payout_pattern: "daily",
        income_variability: "variable",
        handles_cod: true,
        safe_runway_buffer: "2500.00",
        preferred_language: "hi",
        daily_living_estimate: "300.00",
        daily_work_estimate: "200.00",
        onboarding_completed: true,
        created_at: "2026-11-21T00:00:00Z",
        updated_at: "2026-11-21T00:00:00Z",
      },
      error: null,
    });

    const updated = await updateMyProfile(userId, {
      handles_cod: true,
      safe_runway_buffer: 250000,
    });
    assertStrictEqual(updated.handles_cod, true);
    assertStrictEqual(updated.safe_runway_buffer, "2500.00");
  });

  // Test 4: Verify separation of universal personal living vs occupation-specific work categories
  await it("Test 4: Universal personal living vs occupation-specific work categories are distinct", () => {
    // Living categories must be universal personal necessities
    assertTrue(UNIVERSAL_LIVING_CATEGORIES.includes("food"), "food is personal");
    assertTrue(UNIVERSAL_LIVING_CATEGORIES.includes("rent"), "rent is personal");
    assertTrue(UNIVERSAL_LIVING_CATEGORIES.includes("groceries"), "groceries is personal");
    assertTrue(UNIVERSAL_LIVING_CATEGORIES.includes("healthcare"), "healthcare is personal");
    assertTrue(UNIVERSAL_LIVING_CATEGORIES.includes("utility"), "utility is personal");

    // Occupation-specific work categories must adapt per persona
    const deliveryWork = OCCUPATION_WORK_CATEGORIES.delivery;
    assertTrue(deliveryWork.includes("fuel"), "delivery has fuel");
    assertTrue(deliveryWork.includes("vehicle_maintenance"), "delivery has maintenance");

    const driverWork = OCCUPATION_WORK_CATEGORIES.driver;
    assertTrue(driverWork.includes("toll_parking"), "driver has toll_parking");

    const freelancerWork = OCCUPATION_WORK_CATEGORIES.freelancer;
    assertTrue(freelancerWork.includes("software_tools"), "freelancer has software_tools");
    assertTrue(freelancerWork.includes("coworking"), "freelancer has coworking");

    const serviceWork = OCCUPATION_WORK_CATEGORIES.service;
    assertTrue(serviceWork.includes("tools"), "service has tools");
    assertTrue(serviceWork.includes("materials"), "service has materials");

    const vendorWork = OCCUPATION_WORK_CATEGORIES.small_vendor;
    assertTrue(vendorWork.includes("inventory"), "vendor has inventory");
    assertTrue(vendorWork.includes("packaging"), "vendor has packaging");

    const dailyWageWork = OCCUPATION_WORK_CATEGORIES.daily_wage;
    assertTrue(dailyWageWork.includes("safety_gear"), "daily wage has safety gear");

    const seasonalWork = OCCUPATION_WORK_CATEGORIES.seasonal_worker;
    assertTrue(seasonalWork.includes("seeds_fertilizer"), "seasonal has seeds");
  });

  console.log("\n=================================================");
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${passCount + failCount} total`);
  console.log("=================================================");
  if (failCount > 0) {
    const proc = (globalThis as unknown as { process?: { exit: (code: number) => void } }).process;
    proc?.exit(1);
  }
}

runTests();
