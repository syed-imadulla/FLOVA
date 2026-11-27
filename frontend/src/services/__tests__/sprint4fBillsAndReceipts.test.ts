// =====================================================================
// FLOVA Sprint 4F: Bills & Receipt Persistence Tests
// Covers:
//   - Receipt upload ONLY after explicit confirmation
//   - Receipt persistence & retrieval via short-lived signed URLs
//   - Private Storage access & cross-user access rejection
//   - Unsupported file type & oversized file rejection
//   - Upload failure & retry without duplicates
//   - Database save failure & compensation cleanup (no orphan objects)
//   - Receipt preservation during unrelated transaction edits
//   - Commitment editing, paid/cancelled history, and status transitions
// =====================================================================

import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { mockState, resetMockState } from "./mockSupabase";
import {
  addCommitment,
  confirmCandidateTransaction,
  listCommitments,
  setCommitmentStatus,
  updateCommitment,
  updateTransaction,
} from "../data";
import {
  assertUserOwnsReceiptPath,
  getReceiptSignedUrl,
  saveTransactionWithReceipt,
  uploadReceiptEvidence,
  validateReceiptFileMetadata,
} from "../receiptStorage";

beforeEach(() => {
  resetMockState();
});

test("Sprint 4F: Receipt upload, persistence, private signed URL, and cross-user rejection", async () => {
  const file = new File([new Uint8Array([1, 2, 3, 4])], "bill.jpg", { type: "image/jpeg" });
  const txId = "tx-receipt-001";

  const { result: savedTx, receiptPath } = await saveTransactionWithReceipt(file, txId, async (path) => {
    return confirmCandidateTransaction({
      id: txId,
      merchant: "Metro Fuel",
      amountPaise: 45000,
      type: "expense",
      category: "fuel",
      expenseType: "work",
      date: "2026-11-27",
      description: "Fuel receipt",
      ownership: "mine",
      paymentMethod: "upi",
      receiptPath: path,
      needsReview: false,
      missingFields: [],
      kind: "physical_receipt",
    });
  });

  assert.equal(savedTx.receipt_path, receiptPath);
  assert.ok(receiptPath.startsWith("test-user-id/"), "Storage path must be user-scoped");
  assert.equal(mockState.receiptObjects.size, 1);

  // Short-lived signed URL retrieval
  const signedUrl = await getReceiptSignedUrl(receiptPath, 120);
  assert.ok(signedUrl.includes("token="), "Should return a short-lived signed URL");
  assert.ok(!signedUrl.includes("/object/public/"), "Must never expose a public URL");

  // Cross-user access rejection
  assert.throws(
    () => assertUserOwnsReceiptPath("test-user-id", "other-user-id/tx-1.jpg"),
    /Access denied/i
  );
  await assert.rejects(
    () => getReceiptSignedUrl("other-user-id/tx-1.jpg"),
    /Access denied/i
  );

  // Preserves receipt_path during unrelated transaction edits
  const edited = await updateTransaction(savedTx.id, {
    type: "expense",
    amount: 46000,
    category: "fuel",
    expenseType: "work",
    description: "Metro Fuel corrected",
    receiptPath: savedTx.receipt_path,
  });
  assert.equal(edited.receipt_path, receiptPath);
});

test("Sprint 4F: Unsupported file types and oversized files are rejected before upload", async () => {
  const badExe = new File([new Uint8Array([1, 2])], "malware.exe", { type: "application/x-msdownload" });
  assert.throws(() => validateReceiptFileMetadata(badExe), /Unsupported receipt format/i);

  const bigPdf = new File([new Uint8Array(6 * 1024 * 1024)], "huge.pdf", { type: "application/pdf" });
  assert.throws(() => validateReceiptFileMetadata(bigPdf), /exceeds the 5 MB/i);

  const validPdf = new File([new Uint8Array(1024)], "invoice.pdf", { type: "application/pdf" });
  assert.equal(validateReceiptFileMetadata(validPdf), "application/pdf");
  assert.equal(mockState.receiptObjects.size, 0);
});

test("Sprint 4F: Upload failure leaves zero DB rows; retry succeeds cleanly without duplicates", async () => {
  const file = new File([new Uint8Array([1, 2, 3])], "chai.png", { type: "image/png" });
  const txId = "tx-retry-001";

  mockState.receiptUploadError = "Simulated network drop";
  await assert.rejects(
    () =>
      saveTransactionWithReceipt(file, txId, async (path) =>
        confirmCandidateTransaction({
          id: txId,
          merchant: "Chai Point",
          amountPaise: 8000,
          type: "expense",
          category: "food",
          expenseType: "living",
          date: "2026-11-27",
          description: "Tea",
          ownership: "mine",
          receiptPath: path,
          needsReview: false,
          missingFields: [],
          kind: "physical_receipt",
        })
      ),
    /Simulated network drop/i
  );
  assert.equal(mockState.transactions.length, 0);
  assert.equal(mockState.receiptObjects.size, 0);

  // Retry succeeds with same candidate ID
  mockState.receiptUploadError = null;
  const { result } = await saveTransactionWithReceipt(file, txId, async (path) =>
    confirmCandidateTransaction({
      id: txId,
      merchant: "Chai Point",
      amountPaise: 8000,
      type: "expense",
      category: "food",
      expenseType: "living",
      date: "2026-11-27",
      description: "Tea",
      ownership: "mine",
      receiptPath: path,
      needsReview: false,
      missingFields: [],
      kind: "physical_receipt",
    })
  );
  assert.equal(mockState.transactions.length, 1);
  assert.equal(mockState.receiptObjects.size, 1);
  assert.ok(result.receipt_path?.endsWith(`${txId}.png`));
});

test("Sprint 4F: DB save failure cleans up uploaded storage object (no orphan receipt)", async () => {
  const file = new File([new Uint8Array([1, 2, 3])], "bill.webp", { type: "image/webp" });
  const txId = "tx-db-fail-001";

  await assert.rejects(
    () =>
      saveTransactionWithReceipt(file, txId, async () => {
        throw new Error("Simulated Postgres constraint error");
      }),
    /Simulated Postgres constraint error/i
  );

  assert.equal(mockState.receiptObjects.size, 0, "Compensation cleanup must remove orphaned storage object");
  assert.equal(mockState.transactions.length, 0);

  // Direct upload + idempotent upsert does not duplicate
  const p1 = await uploadReceiptEvidence(file, txId);
  const p2 = await uploadReceiptEvidence(file, txId);
  assert.equal(p1, p2);
  assert.equal(mockState.receiptObjects.size, 1);
});

test("Sprint 4F: Commitment editing, paid/cancelled history, and status transitions", async () => {
  const rent = await addCommitment({
    title: "Room rent",
    amount: 600000,
    dueDate: "2026-12-01",
    kind: "bill",
    category: "rent",
  });
  const emi = await addCommitment({
    title: "Bike EMI",
    amount: 350000,
    dueDate: "2026-12-05",
    kind: "debt",
    category: "emi",
  });

  // Edit upcoming commitment
  const editedRent = await updateCommitment(rent.id, {
    title: "Room rent + water",
    amount: 625000,
    dueDate: "2026-12-03",
    kind: "bill",
    category: "rent",
  });
  assert.equal(editedRent.title, "Room rent + water");
  assert.equal(editedRent.amount, "6250.00");
  assert.equal(editedRent.due_date, "2026-12-03");
  assert.equal(editedRent.status, "upcoming");

  // Transition statuses: rent -> paid, emi -> cancelled
  await setCommitmentStatus(rent.id, "paid");
  await setCommitmentStatus(emi.id, "cancelled");

  // Editing a paid commitment preserves 'paid' status
  const editedPaid = await updateCommitment(rent.id, {
    title: "Room rent (Nov)",
    amount: 625000,
    dueDate: "2026-12-03",
    kind: "bill",
    category: "rent",
  });
  assert.equal(editedPaid.status, "paid");

  const upcoming = await listCommitments("upcoming");
  const paid = await listCommitments("paid");
  const cancelled = await listCommitments("cancelled");
  const all = await listCommitments("all");

  assert.equal(upcoming.length, 0);
  assert.equal(paid.length, 1);
  assert.equal(cancelled.length, 1);
  assert.equal(all.length, 2);
});
