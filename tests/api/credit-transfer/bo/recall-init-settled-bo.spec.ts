import { test, expect } from "@playwright/test";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { initiateRecallBo } from "@utils/creditTransferService/recallRequests/bo/initiateRecallBo";
import { getRecallsBo } from "@utils/creditTransferService/recallRequests/bo/getRecallsBo";
import { createSettledRtgsTransaction } from "@utils/creditTransferService/creditTransfer/createSettledRtgsTransaction";

test.describe("BackOffice - Recall Request for Completed CT", () => {
  let testSetup: Awaited<ReturnType<typeof createSettledRtgsTransaction>>;
  let operatorToken: string;

  test.beforeAll(async () => {
    // Create a completed CCT transaction as precondition
    testSetup = await createSettledRtgsTransaction();
    // Get token for the operator
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("BO: Initiate recall for completed credit transfer", async () => {
    const {
      referenceId: creditTransferReferenceId,
      senderTransaction,
      receiverTransaction,
    } = testSetup;

    // Extract required fields from the sender's transaction
    const completedCT = senderTransaction;
    const receiverXmi = receiverTransaction.creditor?.xmi;

    // Verify CT has allow_recall: true (pre-condition for recall test)
    console.log("\n=== Verifying CT allows recall ===");
    expect(completedCT.allow_recall).toBe(true);
    console.log("CT has allow_recall: true - eligible for recall");

    // Step 1: Initiate recall via BO
    console.log("\n=== Step 1: Initiating recall via Back Office ===");
    const { response: recallResponse } = await initiateRecallBo(
      creditTransferReferenceId,
      operatorToken,
      "DUPL",
      "Duplicate Payment",
    );

    expect(recallResponse.status()).toBe(200);
    console.log("BO Recall initiated successfully");

    // Step 2: Verify recall appears in BO recalls list
    console.log("\n=== Step 2: Verifying recall in BO recalls list ===");

    // Wait a moment for the recall to be processed
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { response: recallsResponse, body: recallsBody } =
      await getRecallsBo(operatorToken);

    expect(recallsResponse.status()).toBe(200);
    expect(recallsBody).toHaveProperty("content");
    expect(Array.isArray(recallsBody.content)).toBe(true);

    // Find our recall by clr_sys_ref (which is the CT reference_id)
    const recall = recallsBody.content.find(
      (recall: any) => recall.clr_sys_ref === creditTransferReferenceId,
    );

    expect(recall).toBeDefined();
    console.log(`Recall found in BO list with ID: ${recall.id}`);
    console.log(`Recall status: ${recall.recall_status}`);

    console.log("\n=== Verifying recall details ===");

    // Verify recall status
    expect(recall.recall_status).toBe(RecallStatuses.pending);
    console.log(`Recall status: ${recall.recall_status}`);

    // Verify sender details match original CT
    expect(recall.sender.xmi).toBe(completedCT.debtor.xmi);
    expect(recall.sender.name).toBe(completedCT.debtor.name);
    console.log("Sender details verified");

    // Verify receiver details match original CT
    expect(recall.receiver.xmi).toBe(receiverXmi);
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

    console.log("\n=== BO Recall initiated and verified successfully ===");
  });
});
