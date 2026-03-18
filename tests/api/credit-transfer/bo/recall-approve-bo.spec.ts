// tests/backoffice/recall/recall-approve-bo.spec.ts
import { test, expect } from "@playwright/test";
import { createCompletedCctTransaction } from "@utils/creditTransferService/creditTransfer/createCompletedCctTransaction";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { executeRecallFlowBo } from "@utils/creditTransferService/recallRequests/bo/executeRecallFlowBo";
import { executeRecallApprovalFlowBo } from "@utils/creditTransferService/recallRequests/bo/executeRecallApproveFlowBo";

// DEBUG: Check what RecallStatuses contains
console.log("RecallStatuses object:", RecallStatuses);
console.log("RecallStatuses.pending:", RecallStatuses.pending);
console.log("RecallStatuses.approved:", RecallStatuses.approved);

test.describe("BackOffice - Recall Approval by Operator", () => {
  let testSetup: {
    recallId: number;
    operatorToken: string;
    receiverToken: string;
    creditTransferReferenceId: string;
    completedCT: any;
    receiverXmi: string;
    ctAmount: number;
    senderDomesticCurrency: string;
    senderToken: string;
  };

  test.beforeAll(async () => {
    console.log("\n=== DEBUG: Starting beforeAll ===");

    // Create a completed CCT transaction as precondition
    const completedTransaction = await createCompletedCctTransaction();

    const {
      referenceId: creditTransferReferenceId,
      senderToken,
      receiverToken,
      ctAmount,
      domesticCurrency: senderDomesticCurrency,
      senderTransaction,
      receiverTransaction,
    } = completedTransaction;

    const operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // Extract required fields
    const completedCT = senderTransaction;
    const receiverXmi = receiverTransaction.creditor?.xmi;

    // Verify CT has allow_recall: true (pre-condition for recall test)
    console.log("\n=== Verifying CT allows recall ===");
    expect(completedCT.allow_recall).toBe(true);
    console.log("CT has allow_recall: true - eligible for recall");

    // Initiate recall request via BO
    console.log("\n=== Initiating recall via BO ===");
    const { ourRecall } = await executeRecallFlowBo(
      creditTransferReferenceId,
      operatorToken,
    );

    console.log("Recall initiated with ID:", ourRecall.id);
    console.log("Recall status:", ourRecall.recall_status);
    console.log("Recall clr_sys_ref:", ourRecall.clr_sys_ref);

    // Set up the test data for the actual test
    testSetup = {
      recallId: ourRecall.id,
      operatorToken: operatorToken,
      receiverToken: receiverToken,
      creditTransferReferenceId,
      completedCT,
      receiverXmi,
      ctAmount,
      senderDomesticCurrency,
      senderToken,
    };

    console.log("=== DEBUG: beforeAll completed ===");
  });

  test("BO Operator: Approve recall request and verify credit return", async () => {
    const {
      recallId,
      operatorToken,
      receiverToken,
      creditTransferReferenceId,
      completedCT,
      receiverXmi,
      ctAmount,
      senderDomesticCurrency,
    } = testSetup;

    console.log("\n=== DEBUG: Starting test ===");
    console.log("Recall ID:", recallId);
    console.log("Credit Transfer Reference ID:", creditTransferReferenceId);
    console.log(
      "Operator Token (first 20 chars):",
      operatorToken.substring(0, 20) + "...",
    );
    console.log("RecallStatuses.approved value:", RecallStatuses.approved);
    console.log(
      "RecallStatuses.approved type:",
      typeof RecallStatuses.approved,
    );

    // Execute the complete recall approval flow
    const { recallDetails, completedCreditReturn } =
      await executeRecallApprovalFlowBo(
        recallId,
        operatorToken,
        creditTransferReferenceId,
        completedCT,
        receiverXmi,
        ctAmount,
        senderDomesticCurrency,
        receiverToken,
      );

    console.log("\n=== DEBUG: Verification completed ===");
  });
});
