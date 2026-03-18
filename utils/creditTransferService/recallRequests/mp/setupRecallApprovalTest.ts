import { expect } from "@playwright/test";
import { setupCompletedCreditTransfer } from "../../creditTransfer/setupCompletedCreditTransfer";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";
import { executeRecallFlow } from "./executeRecallFlow";
import { waitForRecallStatus } from "./waitForRecallStatus";
import { RecallTestSetup } from "../../../../modules/creditTransfer/recallTestSetup";

/**
 * Sets up a recall request for approval testing
 */
export async function setupRecallApprovalTest(): Promise<
  RecallTestSetup & { recallId: number }
> {
  // Changed to number
  console.log("Setting up recall approval test...");

  // Setup completed credit transfer
  const creditTransferSetup = await setupCompletedCreditTransfer();

  // Verify CT has allow_recall: true
  console.log("\n=== Verifying CT allows recall ===");
  expect(creditTransferSetup.completedCT.allow_recall).toBe(true);
  console.log("CT has allow_recall: true - eligible for recall");

  // Initiate recall request
  const { ourRecall } = await executeRecallFlow(
    creditTransferSetup.creditTransferReferenceId,
    creditTransferSetup.senderToken,
    creditTransferSetup.completedCT,
    creditTransferSetup.receiverXmi,
  );

  // Wait for recall to be in PENDING status
  await waitForRecallStatus(
    ourRecall.id, // Use numeric ID here
    RecallStatuses.pending,
    creditTransferSetup.receiverToken,
  );

  return {
    senderToken: creditTransferSetup.senderToken,
    receiverToken: creditTransferSetup.receiverToken,
    operatorToken: creditTransferSetup.operatorToken,
    creditTransferReferenceId: creditTransferSetup.creditTransferReferenceId,
    completedCT: creditTransferSetup.completedCT,
    senderDomesticCurrency: creditTransferSetup.senderDomesticCurrency,
    ctAmount: creditTransferSetup.ctAmount,
    receiverXmi: creditTransferSetup.receiverXmi,
    recallId: ourRecall.id, // Return numeric ID
  };
}
