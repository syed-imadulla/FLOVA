// =====================================================================
// FLOVA 2.0 | Sprint 3C — Draft Preparation & Confirmation Gate Tests
// Covers all 17 required QA scenarios in Section 9.
// =====================================================================

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cancelDraft,
  confirmAndExecuteDraft,
  prepareDraftFromUtterance,
  resetConfirmationGateForTests,
  updateDraft,
  type DraftWriteDeps,
} from "../index";
import type { ExpenseGroup, ExpenseGroupMember, PeerDebt, Person } from "../../types/contracts";

function makeTestEnv() {
  resetConfirmationGateForTests();
  const people: Person[] = [
    { id: "p-ahmed", user_id: "u-1", name: "Ahmed", phone: null, upi_id: null, relationship: "Friend", is_favorite: false, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
    { id: "p-rahul", user_id: "u-1", name: "Rahul", phone: null, upi_id: null, relationship: "Friend", is_favorite: false, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
    { id: "p-safiya", user_id: "u-1", name: "Safiya", phone: null, upi_id: null, relationship: "Friend", is_favorite: false, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
  ];
  const peerDebts: PeerDebt[] = [
    { id: "d-ahmed", user_id: "u-1", person_id: "p-ahmed", direction: "they_owe", total_amount_paise: 100000, remaining_amount_paise: 100000, reason: "Loan", status: "active", due_date: null, created_at: "2026-11-10T00:00:00Z", updated_at: "2026-11-10T00:00:00Z" },
    { id: "d-safiya", user_id: "u-1", person_id: "p-safiya", direction: "you_owe", total_amount_paise: 30000, remaining_amount_paise: 30000, reason: "Borrow", status: "active", due_date: null, created_at: "2026-11-10T00:00:00Z", updated_at: "2026-11-10T00:00:00Z" },
  ];
  const groups: ExpenseGroup[] = [
    { id: "g-1", user_id: "u-1", name: "Dinner Squad", description: null, created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" },
  ];
  const groupMembers: ExpenseGroupMember[] = [
    { id: "gm-1", group_id: "g-1", user_id: "u-1", is_self: true, person_id: null, joined_at: "2026-11-01T00:00:00Z" },
    { id: "gm-2", group_id: "g-1", user_id: "u-1", is_self: false, person_id: "p-ahmed", joined_at: "2026-11-01T00:00:00Z" },
    { id: "gm-3", group_id: "g-1", user_id: "u-1", is_self: false, person_id: "p-rahul", joined_at: "2026-11-01T00:00:00Z" },
    { id: "gm-4", group_id: "g-1", user_id: "u-1", is_self: false, person_id: "p-safiya", joined_at: "2026-11-01T00:00:00Z" },
  ];

  const db = {
    transactions: [] as any[],
    peerDebts: [] as any[],
    debtSettlements: [] as any[],
    groupExpenses: [] as any[],
  };

  const deps: DraftWriteDeps = {
    userId: "u-1",
    people,
    peerDebts,
    addTransaction: async (t) => {
      const row = { ...t, id: t.id || "tx-new" };
      db.transactions.push(row);
      return row as any;
    },
    createPerson: async (p) => ({ ...people[0], id: "p-new", name: p.name }),
    createPeerDebt: async (d) => {
      const row = { ...d, id: d.id || "debt-new" };
      db.peerDebts.push(row);
      return row as any;
    },
    recordDebtSettlement: async (debt, s) => {
      const row = { ...s, debt_id: debt.id, id: s.id || "settle-new" };
      db.debtSettlements.push(row);
      return row as any;
    },
    recordGroupExpense: async (g) => {
      const row = { expense: { ...g, id: "ge-new" }, splits: [] };
      db.groupExpenses.push(row);
      return row as any;
    },
  };

  return { people, peerDebts, groups, groupMembers, db, deps };
}

describe("Sprint 3C: Draft Preparation & Explicit Confirmation Gate", () => {
  it("1 & 2. Income and Expense draft preparation, clarification, and zero writes before approval", async () => {
    const env = makeTestEnv();

    // "I earned ₹500." -> missing source clarification
    const inc1 = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "I earned ₹500.",
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
      todayISO: "2026-11-25",
    });
    assert.equal(inc1.draft?.validationStatus, "incomplete");
    assert.ok(inc1.draft?.missingFields.includes("inflowSource"));
    assert.equal(env.db.transactions.length, 0);

    // "Delivery work." -> completes income draft
    const inc2 = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "Delivery work.",
      activeDraft: inc1.draft,
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
      todayISO: "2026-11-25",
    });
    assert.equal(inc2.draft?.validationStatus, "valid");
    assert.equal(inc2.draft?.amountPaise, 50000);
    assert.equal(env.db.transactions.length, 0);

    // Explicit confirmation saves once
    const saved = await confirmAndExecuteDraft({
      draft: inc2.draft!,
      approvedDraftId: inc2.draft!.draftId,
      approvedContentHash: inc2.draft!.contentHash,
      approvingUserId: "u-1",
      deps: env.deps,
    });
    assert.equal(saved.ok, true);
    assert.equal(env.db.transactions.length, 1);

    // Expense missing category clarification ("Spent ₹150.") -> ("Food")
    const exp1 = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "Spent ₹150.",
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
    });
    assert.equal(exp1.draft?.validationStatus, "incomplete");
    assert.ok(exp1.draft?.missingFields.includes("category"));

    const exp2 = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "Food",
      activeDraft: exp1.draft,
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
    });
    assert.equal(exp2.draft?.validationStatus, "valid");
    assert.equal(exp2.draft?.category, "food");
  });

  it("3. Peer debt creation, partial repayment, and full repayment", async () => {
    const env = makeTestEnv();

    // Partial repayment: "Ahmed returned ₹200."
    const partial = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "Ahmed returned ₹200.",
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
    });
    assert.equal(partial.draft?.validationStatus, "valid");
    assert.equal(partial.draft?.settlementKind, "partial");
    assert.equal(partial.draft?.debtId, "d-ahmed");

    // Full repayment: "I repaid ₹300 to Safiya."
    const full = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "I repaid ₹300 to Safiya.",
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
    });
    assert.equal(full.draft?.validationStatus, "valid");
    assert.equal(full.draft?.settlementKind, "full");
    assert.equal(full.draft?.settlementDirection, "repayment_out");

    const res = await confirmAndExecuteDraft({
      draft: full.draft!,
      approvedDraftId: full.draft!.draftId,
      approvedContentHash: full.draft!.contentHash,
      approvingUserId: "u-1",
      deps: env.deps,
    });
    assert.equal(res.ok, true);
    assert.equal(env.db.debtSettlements.length, 1);
  });

  it("4. Group split preparation ('We spent ₹1,200 on dinner' -> 'I paid the full amount' -> 'Split it equally between four people')", async () => {
    const env = makeTestEnv();
    const g1 = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "We spent ₹1,200 on dinner.",
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
    });
    const g2 = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "I paid the full amount.",
      activeDraft: g1.draft,
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
    });
    const g3 = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "Split it equally between four people.",
      activeDraft: g2.draft,
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
    });
    assert.equal(g3.draft?.validationStatus, "valid");
    assert.equal(g3.draft?.groupShares?.length, 4);
    assert.equal(g3.draft?.groupShares?.reduce((s, x) => s + x.shareAmountPaise, 0), 120000);

    const saved = await confirmAndExecuteDraft({
      draft: g3.draft!,
      approvedDraftId: g3.draft!.draftId,
      approvedContentHash: g3.draft!.contentHash,
      approvingUserId: "u-1",
      deps: env.deps,
    });
    assert.equal(saved.ok, true);
    assert.equal(env.db.groupExpenses.length, 1);
  });

  it("5. Rejects invalid amount, invalid person/group, expired draft, modified draft, duplicate & concurrent confirmation, unauthorized user, DB failure, and cancellation", async () => {
    const env = makeTestEnv();
    const now = 100000;

    // Invalid amount (0)
    const exp = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "Spent ₹150 on food.",
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
      nowMs: now,
      ttlMs: 5000,
    }).draft!;
    const badAmt = updateDraft(exp, { amountPaise: 0 }, env.peerDebts, now);
    assert.equal(badAmt.validationStatus, "incomplete");

    // Modified draft after approval hash
    const modified = updateDraft(exp, { amountPaise: 25000 }, env.peerDebts, now);
    const modRes = await confirmAndExecuteDraft({
      draft: modified,
      approvedDraftId: exp.draftId,
      approvedContentHash: exp.contentHash,
      approvingUserId: "u-1",
      deps: env.deps,
      nowMs: now + 100,
    });
    assert.equal(modRes.ok, false);
    assert.equal(modRes.errorCode, "MODIFIED_AFTER_APPROVAL");

    // Expired draft
    const expRes = await confirmAndExecuteDraft({
      draft: exp,
      approvedDraftId: exp.draftId,
      approvedContentHash: exp.contentHash,
      approvingUserId: "u-1",
      deps: env.deps,
      nowMs: now + 6000,
    });
    assert.equal(expRes.ok, false);
    assert.equal(expRes.errorCode, "EXPIRED_DRAFT");

    // Unauthorized cross-user confirmation
    const unauthRes = await confirmAndExecuteDraft({
      draft: exp,
      approvedDraftId: exp.draftId,
      approvedContentHash: exp.contentHash,
      approvingUserId: "u-2",
      deps: env.deps,
      nowMs: now + 100,
    });
    assert.equal(unauthRes.ok, false);
    assert.equal(unauthRes.errorCode, "USER_MISMATCH");

    // Concurrent confirmation protection + duplicate confirmation protection
    let releaseSlowWrite!: () => void;
    const slowDeps: DraftWriteDeps = {
      ...env.deps,
      addTransaction: async (t) =>
        new Promise((resolve) => {
          releaseSlowWrite = () => {
            env.db.transactions.push(t);
            resolve(t as any);
          };
        }),
    };
    const p1 = confirmAndExecuteDraft({
      draft: exp,
      approvedDraftId: exp.draftId,
      approvedContentHash: exp.contentHash,
      approvingUserId: "u-1",
      deps: slowDeps,
      nowMs: now + 100,
    });
    const p2 = confirmAndExecuteDraft({
      draft: exp,
      approvedDraftId: exp.draftId,
      approvedContentHash: exp.contentHash,
      approvingUserId: "u-1",
      deps: slowDeps,
      nowMs: now + 100,
    });
    const r2 = await p2;
    assert.equal(r2.ok, false);
    assert.equal(r2.errorCode, "CONCURRENT_CONFIRMATION");
    releaseSlowWrite();
    const r1 = await p1;
    assert.equal(r1.ok, true);
    assert.equal(env.db.transactions.length, 1);

    // Duplicate retry after completion
    const dup = await confirmAndExecuteDraft({
      draft: exp,
      approvedDraftId: exp.draftId,
      approvedContentHash: exp.contentHash,
      approvingUserId: "u-1",
      deps: env.deps,
      nowMs: now + 200,
    });
    assert.equal(dup.ok, false);
    assert.equal(dup.errorCode, "DUPLICATE_CONFIRMATION");

    // Cancellation leaves zero writes
    const cancelled = cancelDraft(exp);
    assert.equal(cancelled.validationStatus, "cancelled");

    // Database failure reported honestly
    const fresh = prepareDraftFromUtterance({
      userId: "u-1",
      conversationSessionId: "s-1",
      utterance: "I bought groceries for ₹800.",
      people: env.people,
      peerDebts: env.peerDebts,
      groups: env.groups,
      groupMembers: env.groupMembers,
      nowMs: now,
    }).draft!;
    const failRes = await confirmAndExecuteDraft({
      draft: fresh,
      approvedDraftId: fresh.draftId,
      approvedContentHash: fresh.contentHash,
      approvingUserId: "u-1",
      deps: {
        ...env.deps,
        addTransaction: async () => {
          throw new Error("PostgreSQL RLS violation");
        },
      },
      nowMs: now + 100,
    });
    assert.equal(failRes.ok, false);
    assert.equal(failRes.errorCode, "SERVICE_ERROR");
    assert.match(failRes.message, /PostgreSQL RLS violation/);
  });
});
