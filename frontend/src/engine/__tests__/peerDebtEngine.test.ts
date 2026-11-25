// =====================================================================
// FLOVA Financial Engine — Peer Debt & Settlement Engine Tests (Sprint 1)
// =====================================================================

import { assertStrictEqual, assertThrows, describe, it } from "./testUtils";
import { assertPaise } from "../../lib/money";
import {
  calculatePeerDebtSummary,
  validateAndApplySettlement,
} from "../peerDebtEngine";
import type { PeerDebtEngineItem } from "../../types/contracts";

describe("Peer Debt Engine & Settlement Validation", () => {
  const checkedAt = "2026-11-20T08:00:00Z";

  it("borrowing increases cash delta and totalOwedByUser without creating receivables", () => {
    const debts: PeerDebtEngineItem[] = [
      {
        id: "debt-1",
        personId: "p-1",
        personName: "Amit",
        direction: "you_owe",
        totalAmountPaise: 500000, // ₹5,000
        remainingAmountPaise: 500000,
        status: "active",
        dueDate: "2027-01-20",
        createdAt: "2026-11-20T10:00:00Z",
      },
    ];

    const summary = calculatePeerDebtSummary({ peerDebts: debts, checkedAt });
    assertStrictEqual(summary.netCashDeltaSinceCheckinPaise, 500000);
    assertStrictEqual(summary.totalOwedByUserPaise, 500000);
    assertStrictEqual(summary.totalReceivablePaise, 0);
  });

  it("lending decreases cash delta and creates receivable without liability", () => {
    const debts: PeerDebtEngineItem[] = [
      {
        id: "debt-2",
        personId: "p-2",
        personName: "Priya",
        direction: "they_owe",
        totalAmountPaise: 300000, // ₹3,000
        remainingAmountPaise: 300000,
        status: "active",
        dueDate: null,
        createdAt: "2026-11-20T11:00:00Z",
      },
    ];

    const summary = calculatePeerDebtSummary({ peerDebts: debts, checkedAt });
    assertStrictEqual(summary.netCashDeltaSinceCheckinPaise, -300000);
    assertStrictEqual(summary.totalOwedByUserPaise, 0);
    assertStrictEqual(summary.totalReceivablePaise, 300000);
  });

  it("rejects mismatched settlement direction (repayment_in on you_owe and repayment_out on they_owe)", () => {
    const youOwe: PeerDebtEngineItem = {
      id: "d1",
      personId: "p1",
      direction: "you_owe",
      totalAmountPaise: 500000,
      remainingAmountPaise: 500000,
      status: "active",
      dueDate: null,
      createdAt: "2026-11-20T10:00:00Z",
    };
    const res1 = validateAndApplySettlement(youOwe, {
      id: "s1",
      direction: "repayment_in",
      amountPaise: 100000,
    });
    assertStrictEqual(res1.valid, false);

    const theyOwe: PeerDebtEngineItem = { ...youOwe, id: "d2", direction: "they_owe" };
    const res2 = validateAndApplySettlement(theyOwe, {
      id: "s2",
      direction: "repayment_out",
      amountPaise: 100000,
    });
    assertStrictEqual(res2.valid, false);
  });

  it("rejects over-settlement and handles partial -> full settlement lifecycle", () => {
    const debt: PeerDebtEngineItem = {
      id: "d1",
      personId: "p1",
      direction: "you_owe",
      totalAmountPaise: 500000,
      remainingAmountPaise: 500000,
      status: "active",
      dueDate: null,
      createdAt: "2026-11-20T10:00:00Z",
    };

    // Overpayment rejected
    const over = validateAndApplySettlement(debt, {
      id: "s-over",
      direction: "repayment_out",
      amountPaise: 500001,
    });
    assertStrictEqual(over.valid, false);

    // Partial repayment ₹2,000
    const partial = validateAndApplySettlement(debt, {
      id: "s1",
      direction: "repayment_out",
      amountPaise: 200000,
    });
    assertStrictEqual(partial.valid, true);
    assertStrictEqual(partial.cashDeltaPaise, -200000);
    assertStrictEqual(partial.updatedDebt?.remainingAmountPaise, 300000);
    assertStrictEqual(partial.updatedDebt?.status, "partially_settled");

    // Final repayment ₹3,000
    const full = validateAndApplySettlement(partial.updatedDebt!, {
      id: "s2",
      direction: "repayment_out",
      amountPaise: 300000,
    });
    assertStrictEqual(full.valid, true);
    assertStrictEqual(full.updatedDebt?.remainingAmountPaise, 0);
    assertStrictEqual(full.updatedDebt?.status, "settled");
  });

  it("protects against concurrent settlement race using expectedRemainingPaise", () => {
    const debt: PeerDebtEngineItem = {
      id: "d-race",
      personId: "p1",
      direction: "you_owe",
      totalAmountPaise: 500000,
      remainingAmountPaise: 500000,
      status: "active",
      dueDate: null,
      createdAt: "2026-11-20T10:00:00Z",
    };

    // Client A and Client B both read remaining = 500000
    const resA = validateAndApplySettlement(
      debt,
      { id: "sA", direction: "repayment_out", amountPaise: 300000 },
      { expectedRemainingPaise: 500000 }
    );
    assertStrictEqual(resA.valid, true);

    // Client B tries to apply against stale expectedRemainingPaise = 500000 after Client A committed
    const resB = validateAndApplySettlement(
      resA.updatedDebt!,
      { id: "sB", direction: "repayment_out", amountPaise: 300000 },
      { expectedRemainingPaise: 500000 }
    );
    assertStrictEqual(resB.valid, false);
  });

  it("assertPaise validates bigint-paise columns without multiplying by 100", () => {
    assertStrictEqual(assertPaise(500000), 500000);
    assertStrictEqual(assertPaise("500000"), 500000);
    assertThrows(() => assertPaise(5000.5), /safe integer/);
    assertThrows(() => assertPaise("5000.00"), /Invalid integer paise/);
  });
});
