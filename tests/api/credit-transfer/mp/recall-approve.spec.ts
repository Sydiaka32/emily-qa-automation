import { test, expect } from "@playwright/test";
import { createCompletedCctTransaction } from "@utils/creditTransferService/creditTransfer/createCompletedCctTransaction";
import { verifyRecallApprovalDetails } from "@utils/creditTransferService/recallRequests/mp/verifyRecallApprovalDetails";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { executeRecallFlowBo } from "@utils/creditTransferService/recallRequests/bo/executeRecallFlowBo";
import { executeRecallApprovalFlowBo } from "@utils/creditTransferService/recallRequests/bo/executeRecallApproveFlowBo";
import { waitForRecallStatusBo } from "@utils/creditTransferService/recallRequests/bo/waitForRecallStatusBo"; // Add this

test.describe("BackOffice - Recall Approval by Receiver", () => {
  let testSetup: {
    recallId: number;
    operatorToken: string; // Changed from receiverToken to operatorToken
    creditTransferReferenceId: string;
    completedCT: any;
    receiverXmi: string;
    ctAmount: number;
    senderDomesticCurrency: string;
    senderToken: string;
  };
  let operatorToken: string;

  test.beforeAll(async () => {
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

    operatorToken = await getOperatorToken(
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
    const { ourRecall } = await executeRecallFlowBo(
      creditTransferReferenceId,
      operatorToken,
    );

    // Wait for recall to be in PENDING status - USE BO VERSION
    await waitForRecallStatusBo(
      ourRecall.id,
      RecallStatuses.pending,
      operatorToken,
    );

    // Set up the test data for the actual test
    testSetup = {
      recallId: ourRecall.id,
      operatorToken: operatorToken, // Store operator token, not receiver token
      creditTransferReferenceId,
      completedCT,
      receiverXmi,
      ctAmount,
      senderDomesticCurrency,
      senderToken,
    };
  });

  test("Approve recall request and verify credit return", async () => {
    const {
      recallId,
      operatorToken,
      creditTransferReferenceId,
      completedCT,
      receiverXmi,
      ctAmount,
      senderDomesticCurrency,
    } = testSetup;

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
      );

    // Additional verification of recall approval and credit return details
    verifyRecallApprovalDetails(
      recallDetails,
      completedCreditReturn,
      recallId,
      creditTransferReferenceId,
      receiverXmi,
      completedCT.debtor.xmi,
      ctAmount,
      senderDomesticCurrency,
    );
  });
});
