import { test, expect } from "@playwright/test";
import { createCompletedCctTransaction } from "@utils/creditTransferService/creditTransfer/createCompletedCctTransaction";
import { executeRecallFlow } from "@utils/creditTransferService/recallRequests/mp/executeRecallFlow";
import { findRecallByClrSysRef } from "@utils/creditTransferService/recallRequests/mp/findRecallByClrSysRef";
import { declineRecall } from "@utils/creditTransferService/recallRequests/mp/declineRecall";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";
import { DeclineRecallPayload } from "../../../../modules/creditTransfer/declineRecallPayload";
import { waitForRecallStatus } from "@utils/creditTransferService/recallRequests/mp/waitForRecallStatus";

test.describe("Recall Decline Flow", () => {
  let testSetup: Awaited<ReturnType<typeof createCompletedCctTransaction>>;

  test.beforeAll(async () => {
    // Create a completed CCT transaction as precondition
    testSetup = await createCompletedCctTransaction();
  });

  test("Receiver should decline a recall request", async () => {
    const {
      referenceId: creditTransferReferenceId,
      senderToken,
      senderTransaction,
      receiverTransaction,
      receiverToken,
    } = testSetup;

    // Verify CT has allow_recall: true (pre-condition for recall test)
    console.log("\n=== Verifying CT allows recall ===");
    expect(senderTransaction.allow_recall).toBe(true);
    console.log("CT has allow_recall: true - eligible for recall");

    // Extract receiver XMI from transaction
    const receiverXmi = receiverTransaction.creditor?.xmi;

    // Execute the complete recall flow (sender initiates recall)
    console.log("\n=== Step 1: Initiating recall as sender ===");
    const { ourRecall } = await executeRecallFlow(
      creditTransferReferenceId,
      senderToken,
      senderTransaction,
      receiverXmi,
    );

    // As receiver, find the recall by clr_sys_ref (CT reference_id)
    console.log("\n=== Step 2: Receiver searching for recall ===");
    const foundRecall = await findRecallByClrSysRef(
      creditTransferReferenceId,
      receiverToken,
    );

    // Wait for recall to be in PENDING status
    // Note: The waitForRecallStatus function should check for recall_status, not status
    await waitForRecallStatus(
      foundRecall.id, // Use foundRecall.id instead of ourRecall.id
      RecallStatuses.pending,
      receiverToken,
    );

    // Verify recall was found and is in pending status
    console.log(`Found recall with ID: ${foundRecall.id}`);
    console.log(`Recall status: ${foundRecall.recall_status}`); // Changed from status to recall_status
    expect(foundRecall.id).toBe(ourRecall.id);
    expect(foundRecall.recall_status).toBe(RecallStatuses.pending); // Changed from status to recall_status

    // Decline the recall as receiver
    console.log("\n=== Step 3: Declining recall as receiver ===");

    // Create decline payload based on your API requirements
    const declinePayload: DeclineRecallPayload = {
      reason_code: "NOOR",
      reason_info: "No Original Transaction Received",
    };

    const declineResponse = await declineRecall(
      foundRecall.id,
      receiverToken,
      declinePayload,
    );

    // Verify decline was successful
    console.log(
      `Decline response status: ${declineResponse.response.status()}`,
    );
    console.log(`Decline response body:`, declineResponse.body);

    // Verify recall status changed to declined
    console.log("\n=== Step 4: Verifying recall status ===");

    // Wait for status to update (use findRecallByClrSysRef with retries)
    const updatedRecall = await findRecallByClrSysRef(
      creditTransferReferenceId,
      receiverToken,
    );

    console.log(`Updated recall status: ${updatedRecall.recall_status}`);

    // Check the actual status value returned by your API after decline
    expect(updatedRecall.recall_status).toBe(RecallStatuses.declined);

    console.log("\n=== Test Completed: Recall successfully declined ===");
  });
});
