import { expect } from "@playwright/test";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";

/**
 * Verify approved recall details including return transaction
 */
export function verifyApprovedRecallDetails(
  recall: any,
  originalCT: any,
): void {
  // Verify recall status
  expect(recall.recall_status).toBe(RecallStatuses.approved);

  // Verify sender details match original CT debtor
  expect(recall.sender.xmi).toBe(originalCT.debtor.xmi);
  expect(recall.sender.name).toBe(originalCT.debtor.name);

  // Verify receiver details match original CT creditor
  expect(recall.receiver.xmi).toBe(originalCT.creditor.xmi);
  expect(recall.receiver.name).toBe(originalCT.creditor.name);

  // Verify clr_sys_ref matches original CT reference_id
  expect(recall.clr_sys_ref).toBe(originalCT.reference_id);

  // Verify origin_transaction exists and matches original CT
  expect(recall.origin_transaction).toBeDefined();
  expect(recall.origin_transaction.clr_sys_ref).toBe(originalCT.reference_id);
  expect(recall.origin_transaction.tx_id).toBeDefined();
  expect(recall.origin_transaction.end_to_end_id).toBeDefined();

  // Verify return_transaction exists (clr_sys_ref might be null initially)
  expect(recall.return_transaction).toBeDefined();
  expect(recall.return_transaction.tx_id).toBeDefined();
  expect(recall.return_transaction.end_to_end_id).toBeDefined();

  console.log("Approved recall details verified successfully");
}
