import { test, expect } from "@playwright/test";
import { createCompletedCctTransaction } from "@utils/creditTransferService/creditTransfer/createCompletedCctTransaction";
import { executeRecallFlow } from "@utils/creditTransferService/recallRequests/mp/executeRecallFlow";
import { declineRecall } from "@utils/creditTransferService/recallRequests/mp/declineRecall";
import { getRecalls } from "@utils/creditTransferService/recallRequests/mp/getRecalls";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";

test.describe("Decline Recall by Receiver", () => {
  let testSetup: Awaited<ReturnType<typeof createCompletedCctTransaction>>;
  let pendingRecallId: string;
  let pendingRecallRecallId: string;

  test.beforeAll(async () => {
    // Create a completed CCT transaction as precondition
    testSetup = await createCompletedCctTransaction();

    const {
      referenceId: creditTransferReferenceId,
      senderToken,
      senderTransaction,
      receiverTransaction,
    } = testSetup;

    // Execute recall flow to create a pending recall
    const { ourRecall } = await executeRecallFlow(
      creditTransferReferenceId,
      senderToken,
      senderTransaction,
      receiverTransaction.creditor?.xmi,
    );

    pendingRecallId = ourRecall.id.toString();
    pendingRecallRecallId = ourRecall.recall_id;

    console.log(`Created pending recall: ${pendingRecallRecallId}`);
    console.log(`Numeric ID for API: ${pendingRecallId}`);
  });

  test("Should decline recall as receiver and verify status", async () => {
    // Get a fresh receiver token
    const freshReceiverToken = await getAccessToken(
      config.receiverName,
      config.password,
    );
    console.log("Fresh receiver token obtained");
    console.log(`Using numeric ID: ${pendingRecallId}`);
    console.log(`Looking for recall_id: ${pendingRecallRecallId}`);

    // First, verify the recall is visible to the receiver and is PENDING
    console.log("Checking if recall is visible to receiver...");
    const { body: recallsBefore } = await getRecalls(freshReceiverToken);
    const recallBefore = recallsBefore.content.find(
      (recall: any) => recall.recall_id === pendingRecallRecallId,
    );

    expect(recallBefore).toBeDefined();
    expect(recallBefore.recall_status).toBe(RecallStatuses.pending);
    console.log("Recall found and is PENDING - proceeding with decline");

    // Decline the recall as receiver
    const declinePayload = {
      reason_code: "NOOR",
      reason_info: "No Original Transaction Received",
    };

    let current_member = await getCurrentMember(freshReceiverToken);
    console.log(current_member);
    await declineRecall(
      pendingRecallId,
      freshReceiverToken, // Use fresh token for decline
      declinePayload,
    );

    // Verify the recall status changed to DECLINED
    console.log("Verifying recall status changed to DECLINED...");

    // Use the SAME fresh token to get recalls list
    const { body: recallsList } = await getRecalls(freshReceiverToken);
    const declinedRecall = recallsList.content.find(
      (recall: any) => recall.recall_id === pendingRecallRecallId,
    );

    // Verify the recall was found and has DECLINED status
    expect(declinedRecall).toBeDefined();
    expect(declinedRecall.recall_status).toBe(RecallStatuses.declined);

    // Verify other properties are maintained
    expect(declinedRecall.sender.xmi).toBe(
      testSetup.senderTransaction.debtor.xmi,
    );
    expect(declinedRecall.receiver.xmi).toBe(
      testSetup.receiverTransaction.creditor.xmi,
    );
    expect(declinedRecall.clr_sys_ref).toBe(testSetup.referenceId);

    console.log(`Recall ${pendingRecallRecallId} successfully declined`);
    console.log(`Recall status: ${declinedRecall.recall_status}`);
    console.log(`Recall updated at: ${declinedRecall.recall_updated_at}`);
  });
});
