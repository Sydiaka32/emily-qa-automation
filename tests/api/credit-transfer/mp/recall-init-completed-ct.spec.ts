import { test, expect } from "@playwright/test";
import { createCompletedCctTransaction } from "@utils/creditTransferService/creditTransfer/createCompletedCctTransaction";
import { executeRecallFlow } from "@utils/creditTransferService/recallRequests/mp/executeRecallFlow";
import { verifyRecallDetails } from "@utils/creditTransferService/recallRequests/mp/verifyRecallDetails";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";

test.describe("Recall Request for Completed CT", () => {
  let testSetup: Awaited<ReturnType<typeof createCompletedCctTransaction>>;

  test.beforeAll(async () => {
    // Create a completed CCT transaction as precondition
    testSetup = await createCompletedCctTransaction();
  });

  test("Initiate recall for completed credit transfer", async () => {
    const {
      referenceId: creditTransferReferenceId,
      senderToken,
      senderTransaction, // Use sender's transaction for recall
      receiverTransaction,
    } = testSetup;

    // Extract required fields from the sender's transaction (recall is sender-initiated)
    const completedCT = senderTransaction; // Use senderTransaction, not receiverTransaction
    const receiverXmi = receiverTransaction.creditor?.xmi; // But receiver XMI comes from receiver transaction

    // Verify CT has allow_recall: true (pre-condition for recall test)
    // Use sender's transaction since recall is initiated by sender
    console.log("\n=== Verifying CT allows recall ===");
    expect(completedCT.allow_recall).toBe(true);
    console.log("CT has allow_recall: true - eligible for recall");

    // Execute the complete recall flow
    const { ourRecall } = await executeRecallFlow(
      creditTransferReferenceId,
      senderToken,
      completedCT,
      receiverXmi,
    );

    // Verify recall details
    verifyRecallDetails(
      ourRecall,
      completedCT,
      RecallStatuses.pending,
      completedCT.debtor.xmi,
      receiverXmi,
    );
  });
});
