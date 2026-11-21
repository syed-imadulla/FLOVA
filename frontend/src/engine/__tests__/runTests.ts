// =====================================================================
// FLOVA Financial Engine — Test Suite Runner
// Pure TypeScript test suite runner executing validation, balance, and runway tests.
// =====================================================================

import "./validation.test";
import "./balance.test";
import "./runway.test";
import "./lifecycle.test";
import "./remainingBudget.test";
import "./extraction.test";
import "./extractionPrompt.test";
import "./candidateAdapter.test";
import { runAllTests } from "./testUtils";

void runAllTests().then(({ failed }) => {
  if (failed > 0) {
    const proc = (globalThis as unknown as { process?: { exit: (code: number) => void } }).process;
    proc?.exit(1);
  }
});
