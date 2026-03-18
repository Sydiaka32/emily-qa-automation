import { test, expect } from "@playwright/test";
import { executeRecallFlow } from "@utils/creditTransferService/recallRequests/mp/executeRecallFlow";
import { verifyRecallDetails } from "@utils/creditTransferService/recallRequests/mp/verifyRecallDetails";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";
import { createSettledRtgsTransaction } from "@utils/creditTransferService/creditTransfer/createSettledRtgsTransaction";

test.describe("Recall Request for Settled RTGS Transaction", () => {
  let testSetup: Awaited<ReturnType<typeof createSettledRtgsTransaction>>;

  test.beforeAll(async () => {
    // Create a settled RTGS transaction as precondition
    testSetup = await createSettledRtgsTransaction();
  });

  test("Initiate recall for settled RTGS transaction", async () => {
    const {
      referenceId: creditTransferReferenceId,
      senderToken,
      senderTransaction, // Use sender's transaction for recall
      receiverTransaction,
    } = testSetup;

    // Extract required fields from the sender's transaction (recall is sender-initiated)
    const settledTransaction = senderTransaction; // Use senderTransaction, not receiverTransaction
    const receiverXmi = receiverTransaction.creditor?.xmi; // But receiver XMI comes from receiver transaction

    // Verify transaction has allow_recall: true (pre-condition for recall test)
    // Use sender's transaction since recall is initiated by sender
    console.log("\n=== Verifying settled transaction allows recall ===");
    expect(settledTransaction.allow_recall).toBe(true);
    console.log(
      "Settled transaction has allow_recall: true - eligible for recall",
    );

    // Execute the complete recall flow
    const { ourRecall } = await executeRecallFlow(
      creditTransferReferenceId,
      senderToken,
      settledTransaction,
      receiverXmi,
    );

    // Verify recall details
    verifyRecallDetails(
      ourRecall,
      settledTransaction,
      RecallStatuses.pending,
      settledTransaction.debtor.xmi,
      receiverXmi,
    );
  });
});
