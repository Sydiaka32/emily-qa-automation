import { expect } from "@playwright/test";
import { setupCompletedCreditTransfer } from "../../creditTransfer/setupCompletedCreditTransfer";
import { RecallTestSetup } from "../../../../modules/creditTransfer/recallTestSetup";

/**
 * Sets up a completed credit transfer for recall testing
 */
export async function setupRecallTest(): Promise<RecallTestSetup> {
  console.log("Setting up recall test with completed credit transfer...");

  // Use the existing completed credit transfer setup
  const creditTransferSetup = await setupCompletedCreditTransfer();

  // Verify CT has allow_recall: true (pre-condition for recall test)
  console.log("\n=== Verifying CT allows recall ===");
  expect(creditTransferSetup.completedCT.allow_recall).toBe(true);
  console.log("CT has allow_recall: true - eligible for recall");

  return {
    senderToken: creditTransferSetup.senderToken,
    receiverToken: creditTransferSetup.receiverToken,
    operatorToken: creditTransferSetup.operatorToken,
    creditTransferReferenceId: creditTransferSetup.creditTransferReferenceId,
    completedCT: creditTransferSetup.completedCT,
    senderDomesticCurrency: creditTransferSetup.senderDomesticCurrency,
    ctAmount: creditTransferSetup.ctAmount,
    receiverXmi: creditTransferSetup.receiverXmi,
  };
}
