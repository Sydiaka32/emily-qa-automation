import { expect } from "@playwright/test";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";

/**
 * Verifies recall details match expected values
 */
export function verifyRecallDetails(
  recall: any,
  completedCT: any,
  expectedRecallStatus: string = RecallStatuses.approved,
  expectedSenderXmi: string,
  expectedReceiverXmi: string,
): void {
  console.log("\n=== Verifying recall details ===");

  // Verify recall status
  expect(recall.recall_status).toBe(expectedRecallStatus);
  console.log(`Recall status: ${recall.recall_status}`);

  // Verify sender details match original CT
  expect(recall.sender.xmi).toBe(expectedSenderXmi);
  expect(recall.sender.name).toBe(completedCT.debtor.name);
  console.log("Sender details verified");

  // Verify receiver details match original CT
  expect(recall.receiver.xmi).toBe(expectedReceiverXmi);
  expect(recall.receiver.name).toBe(completedCT.creditor.name);
  console.log("Receiver details verified");

  // Verify recall has required properties
  expect(recall).toHaveProperty("id");
  expect(recall).toHaveProperty("recall_id");
  expect(recall).toHaveProperty("recall_requested_at");
  expect(recall).toHaveProperty("recall_updated_at");
  expect(recall).toHaveProperty("clr_sys_ref");

  console.log(`Recall ID: ${recall.recall_id}`);
  console.log(`Recall requested at: ${recall.recall_requested_at}`);
  console.log(`Original CT reference: ${recall.clr_sys_ref}`);

  console.log("Recall details verified successfully");
}
