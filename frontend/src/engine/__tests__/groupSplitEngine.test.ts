// =====================================================================
// FLOVA Financial Engine — Group Splitting & Accounting Unit Tests
// =====================================================================

import { assertStrictEqual, assertThrows, describe, it } from "./testUtils";
import {
  calculateGroupCashAndBalances,
  computeGroupExpenseAccounting,
  splitCustom,
  splitEqual,
  splitPercentage,
} from "../groupSplitEngine";

describe("Group Split Engine & Accounting Rules", () => {
  const participants4 = [
    { isSelf: true, personId: null },
    { isSelf: false, personId: "p-ahmed" },
    { isSelf: false, personId: "p-bilal" },
    { isSelf: false, personId: "p-sara" },
  ];

  it("equal split among 2, 3, and 4 people conserves total paise and allocates remainder deterministically", () => {
    const s2 = splitEqual(10000, participants4.slice(0, 2));
    assertStrictEqual(s2[0].shareAmountPaise, 5000);
    assertStrictEqual(s2[1].shareAmountPaise, 5000);

    // 1000 paise (₹10) / 3 -> 334, 333, 333
    const s3 = splitEqual(1000, participants4.slice(0, 3));
    assertStrictEqual(s3[0].shareAmountPaise, 334);
    assertStrictEqual(s3[1].shareAmountPaise, 333);
    assertStrictEqual(s3[2].shareAmountPaise, 333);
    assertStrictEqual(s3.reduce((a, b) => a + b.shareAmountPaise, 0), 1000);

    // ₹1,200 (120000 paise) / 4 -> 30000 each
    const s4 = splitEqual(120000, participants4);
    assertStrictEqual(s4.every((s) => s.shareAmountPaise === 30000), true);
  });

  it("validates custom splits and rejects mismatched sums or negative shares", () => {
    const ok = splitCustom(100000, [
      { isSelf: true, personId: null, shareAmountPaise: 40000 },
      { isSelf: false, personId: "p-ahmed", shareAmountPaise: 60000 },
    ]);
    assertStrictEqual(ok[0].shareAmountPaise, 40000);

    assertThrows(
      () =>
        splitCustom(100000, [
          { isSelf: true, personId: null, shareAmountPaise: 40000 },
          { isSelf: false, personId: "p-ahmed", shareAmountPaise: 50000 },
        ]),
      /does not equal/
    );
  });

  it("computes percentage splits with exact conservation and rejects totals != 100%", () => {
    const res = splitPercentage(1000, [
      { isSelf: true, personId: null, percent: 33.33 },
      { isSelf: false, personId: "p-ahmed", percent: 33.33 },
      { isSelf: false, personId: "p-bilal", percent: 33.34 },
    ]);
    assertStrictEqual(res.reduce((a, b) => a + b.shareAmountPaise, 0), 1000);

    assertThrows(
      () =>
        splitPercentage(1000, [
          { isSelf: true, personId: null, percent: 50 },
          { isSelf: false, personId: "p-ahmed", percent: 40 },
        ]),
      /100%/
    );
  });

  it("accounts correctly when current user is the payer (₹1,200 bill, ₹300 own share, ₹900 receivable)", () => {
    const shares = splitEqual(120000, participants4);
    const acc = computeGroupExpenseAccounting({
      totalAmountPaise: 120000,
      paidBySelf: true,
      paidByPersonId: null,
      shares,
    });

    assertStrictEqual(acc.selfSharePaise, 30000); // Only ₹300 is user's consumption expense
    const summary = calculateGroupCashAndBalances({
      checkedAt: "2026-11-20T08:00:00Z",
      groupSplits: acc.splits.map((s, idx) => ({
        id: `sp-${idx}`,
        groupExpenseId: "exp-1",
        isSelf: s.isSelf,
        personId: s.personId,
        direction: s.direction,
        shareAmountPaise: s.shareAmountPaise,
        remainingAmountPaise: s.remainingAmountPaise,
        status: s.status,
        createdAt: "2026-11-20T12:00:00Z",
      })),
    });

    // -₹900 from group splits + (-₹300 in transactions) = -₹1,200 total cash outflow
    assertStrictEqual(summary.netCashDeltaSinceCheckinPaise, -90000);
    assertStrictEqual(summary.totalGroupReceivablePaise, 90000);
    assertStrictEqual(summary.totalGroupLiabilityPaise, 0);
  });

  it("accounts correctly when another participant is the payer (Ahmed pays ₹1,200, user owes ₹300)", () => {
    const shares = splitEqual(120000, participants4);
    const acc = computeGroupExpenseAccounting({
      totalAmountPaise: 120000,
      paidBySelf: false,
      paidByPersonId: "p-ahmed",
      shares,
    });

    assertStrictEqual(acc.selfSharePaise, 30000);
    const summary = calculateGroupCashAndBalances({
      checkedAt: "2026-11-20T08:00:00Z",
      groupSplits: acc.splits.map((s, idx) => ({
        id: `sp-${idx}`,
        groupExpenseId: "exp-2",
        isSelf: s.isSelf,
        personId: s.personId,
        direction: s.direction,
        shareAmountPaise: s.shareAmountPaise,
        remainingAmountPaise: s.remainingAmountPaise,
        status: s.status,
        createdAt: "2026-11-20T12:00:00Z",
      })),
    });

    // +₹300 from group split offsets -₹300 self_share expense in transactions => ₹0 Day-1 cash change
    assertStrictEqual(summary.netCashDeltaSinceCheckinPaise, 30000);
    assertStrictEqual(summary.totalGroupReceivablePaise, 0);
    assertStrictEqual(summary.totalGroupLiabilityPaise, 30000);
  });
});
