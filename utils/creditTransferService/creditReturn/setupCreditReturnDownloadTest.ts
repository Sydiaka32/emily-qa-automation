// In @utils/creditTransferService/creditReturn/setupCreditReturnDownloadTest.ts
import { expect } from "@playwright/test";
import { createCompletedCctTransaction } from "../creditTransfer/createCompletedCctTransaction";
import { initiateCreditReturn } from "./initiateCreditReturn";
import { findCreditReturnByTxId } from "./findCreditReturnByTxId";
import { verifyCreditReturnBasicDetails } from "./verifyCreditReturnDetailsByStatus";
import { waitForCreditReturnCompleted } from "./waitForCreditReturnCompleted";
import { CreditReturnDownloadTestSetup } from "../../../modules/creditTransfer/creditReturnDownloadSetup";

/**
 * Sets up a completed credit transfer with credit return for download testing
 * Uses the new createCompletedCctTransaction utility
 */
export async function setupCreditReturnDownloadTest(): Promise<CreditReturnDownloadTestSetup> {
  console.log("Setting up credit return download test...");

  // Use the new completed credit transfer utility
  const completedTransaction = await createCompletedCctTransaction();

  // Extract the required fields from the completed transaction
  const {
    referenceId: creditTransferReferenceId,
    receiverToken,
    operatorToken,
    ctAmount,
    domesticCurrency: senderDomesticCurrency,
    receiverTransaction,
  } = completedTransaction;

  // Extract the original transaction ID from the receiver's transaction
  const originalTxId = receiverTransaction.tx_id || receiverTransaction.id;
  const receiverXmi = receiverTransaction.creditor?.xmi;
  const completedCT = receiverTransaction;

  // Step: Initiate credit return as receiver
  console.log("\n=== Initiating credit return for download test ===");
  const creditReturnPayload = {
    reason_code: "AM03",
    reason_info: "Not Allowed Currency",
  };

  console.log(`Initiating credit return for CT: ${creditTransferReferenceId}`);

  // Initiate credit return using the utility function
  const creditReturnResponse = await initiateCreditReturn(
    creditTransferReferenceId,
    receiverToken,
    creditReturnPayload.reason_code,
    creditReturnPayload.reason_info,
  );

  // Verify credit return response
  expect(creditReturnResponse.status).toBe(200);
  console.log("Credit return initiated successfully - Status 200");

  // Step: Find the credit return to get its reference_id
  console.log("\n=== Finding credit return to get reference_id ===");
  const creditReturn = await findCreditReturnByTxId(
    originalTxId,
    receiverToken,
  );

  console.log(`Credit return initial status: ${creditReturn.status}`);
  console.log(`Credit return reference ID: ${creditReturn.reference_id}`);

  // Wait for credit return to complete BEFORE any verification
  console.log("\n=== Waiting for credit return to complete in setup ===");
  const completedCreditReturn = await waitForCreditReturnCompleted(
    creditReturn.reference_id,
    receiverToken,
    60,
    1000,
  );

  console.log(
    `Credit return completed with status: ${completedCreditReturn.status}`,
  );

  // Now verify the completed credit return details
  console.log("\n=== Verifying completed credit return details ===");
  verifyCreditReturnBasicDetails(completedCreditReturn, completedCT);

  // Store the COMPLETED credit return reference_id for the download test
  const creditReturnReferenceId = completedCreditReturn.reference_id;
  console.log(
    `Completed credit return reference ID: ${creditReturnReferenceId}`,
  );

  return {
    receiverToken,
    operatorToken,
    creditTransferReferenceId,
    senderDomesticCurrency,
    ctAmount,
    receiverXmi,
    originalTxId,
    creditReturnReferenceId,
    creditReturn: completedCreditReturn, // Return the completed credit return
  };
}
