// =====================================================================
// FLOVA Financial Engine — Test Suite Runner
// Pure TypeScript test suite runner executing validation & balance tests.
// =====================================================================

import "./validation.test";
import "./balance.test";
import { runAllTests } from "./testUtils";

void runAllTests().then(({ failed }) => {
  if (failed > 0) {
    const proc = (globalThis as unknown as { process?: { exit: (code: number) => void } }).process;
    proc?.exit(1);
  }
});
