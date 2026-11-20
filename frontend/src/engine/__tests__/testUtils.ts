// =====================================================================
// FLOVA Engine Test Utilities
// Pure TypeScript test harness: zero external dependencies,
// compiles under strict TypeScript without @types/node or vitest.
// =====================================================================

export interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
}

const suites: TestSuite[] = [];
let currentSuite: TestSuite | null = null;

export function describe(name: string, fn: () => void): void {
  const suite: TestSuite = { name, tests: [] };
  currentSuite = suite;
  suites.push(suite);
  fn();
  currentSuite = null;
}

export function it(name: string, fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    const defaultSuite: TestSuite = { name: "Default Suite", tests: [] };
    suites.push(defaultSuite);
    currentSuite = defaultSuite;
  }
  currentSuite.tests.push({ name, fn });
}

export function assertStrictEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message ?? `Assertion failed: expected ${String(expected)}, but got ${String(actual)}`
    );
  }
}

export function assertMatch(actual: string, pattern: RegExp, message?: string): void {
  if (!pattern.test(actual)) {
    throw new Error(
      message ?? `Assertion failed: "${actual}" does not match pattern ${pattern}`
    );
  }
}

export function assertThrows(fn: () => void, expectedPattern?: RegExp): void {
  try {
    fn();
  } catch (err) {
    if (expectedPattern && !expectedPattern.test(String(err))) {
      throw new Error(`Expected error matching ${expectedPattern}, but got: ${String(err)}`);
    }
    return;
  }
  throw new Error("Expected function to throw, but it succeeded.");
}

export async function runAllTests(): Promise<{ passed: number; failed: number; total: number }> {
  let passed = 0;
  let failed = 0;

  console.log("=================================================");
  console.log("FLOVA Financial Engine Test Suite");
  console.log("=================================================");

  for (const suite of suites) {
    console.log(`\n▶ Suite: ${suite.name}`);
    for (const test of suite.tests) {
      try {
        await test.fn();
        console.log(`  ✔ ${test.name}`);
        passed++;
      } catch (err) {
        console.error(`  ✖ ${test.name}`);
        console.error(`    ${(err as Error).message}`);
        failed++;
      }
    }
  }

  const total = passed + failed;
  console.log("\n-------------------------------------------------");
  console.log(`Results: ${passed} passed, ${failed} failed, ${total} total`);
  console.log("=================================================");

  return { passed, failed, total };
}
