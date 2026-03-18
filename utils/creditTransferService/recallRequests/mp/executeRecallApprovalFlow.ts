import { expect } from "@playwright/test";
import { acceptRecall } from "./acceptRecall";
import { waitForRecallStatus } from "./waitForRecallStatus";
import { getRecallDetails } from "./getRecallDetails";
import { verifyApprovedRecallDetails } from "./verifyApprovedRecallDetails";
import { findCreditTransferByReferenceId } from "../../creditTransfer/findCreditTransferByReferenceId";
import { waitForCreditTransferStatus } from "../../creditTransfer/waitForCreditTransferStatus";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";
import { RecallApprovalFlowResult } from "../../../../modules/creditTransfer/recallApprovalFlowResult";

/**
 * Executes the complete recall approval flow including acceptance and credit return verification
 */
export async function executeRecallApprovalFlow(
  recallId: number, // Changed from string to number
  receiverToken: string,
  creditTransferReferenceId: string,
  completedCT: any,
  receiverXmi: string,
  ctAmount: number,
  senderDomesticCurrency: string,
): Promise<RecallApprovalFlowResult> {
  console.log("\n=== Executing recall approval flow ===");

  // Step 1: Accept recall as receiver
  console.log(`Accepting recall with ID: ${recallId}`);
  const acceptResponse = await acceptRecall(recallId, receiverToken);

  // Verify accept response
  expect(acceptResponse.status).toBe(200);
  console.log("Recall accepted successfully - Status 200");

  // Step 2: Check that recall status becomes APPROVED
  console.log("\n=== Verifying recall status becomes APPROVED ===");
  const approvedRecall = await waitForRecallStatus(
    recallId, // Using numeric ID
    RecallStatuses.approved,
    receiverToken,
  );

  expect(approvedRecall.recall_status).toBe(RecallStatuses.approved);
  console.log(`Recall status verified: ${approvedRecall.recall_status}`);

  // Step 3: Get recall details and verify structure
  console.log("\n=== Getting recall details and verifying structure ===");
  const recallDetailsResponse = await getRecallDetails(recallId, receiverToken); // Using numeric ID
  const recallDetails = recallDetailsResponse.body;

  console.log("Recall details:", JSON.stringify(recallDetails, null, 2));

  // Verify the recall details structure matches expected response
  verifyApprovedRecallDetails(recallDetails, completedCT);

  // Additional verification of specific properties
  expect(recallDetails.id).toBeDefined();
  expect(recallDetails.recall_id).toBeDefined(); // This is the string ID like "recall-7ehF3"
  expect(recallDetails.recall_requested_at).toBeDefined();
  expect(recallDetails.recall_updated_at).toBeDefined();
  expect(recallDetails.clr_sys_ref).toBe(creditTransferReferenceId);

  // Verify origin_transaction matches original CT
  expect(recallDetails.origin_transaction.clr_sys_ref).toBe(
    creditTransferReferenceId,
  );

  // Verify return_transaction exists and has clr_sys_ref
  expect(recallDetails.return_transaction).toBeDefined();
  expect(recallDetails.return_transaction.clr_sys_ref).toBeDefined();
  expect(recallDetails.return_transaction.clr_sys_ref).not.toBeNull();

  console.log(
    `Return transaction tx_id: ${recallDetails.return_transaction.tx_id}`,
  );
  console.log(
    `Return transaction end_to_end_id: ${recallDetails.return_transaction.end_to_end_id}`,
  );
  console.log(
    `Return transaction clr_sys_ref: ${recallDetails.return_transaction.clr_sys_ref}`,
  );

  const creditReturnReferenceId = recallDetails.return_transaction.clr_sys_ref;

  // Step 4: Find credit return and verify it exists
  console.log("\n=== Finding and verifying credit return ===");
  console.log(`Verifying credit return: ${creditReturnReferenceId}`);

  const creditReturn = await findCreditTransferByReferenceId(
    creditReturnReferenceId,
    receiverToken,
  );

  expect(creditReturn).toBeDefined();
  console.log(`Credit return found with status: ${creditReturn.status}`);

  // Wait for credit return to reach COMPLETED status
  console.log("Waiting for credit return to complete...");
  const completedCreditReturn = await waitForCreditTransferStatus(
    creditReturnReferenceId,
    CreditTransferStatuses.completed,
    receiverToken,
  );

  console.log(
    `Credit return completed with status: ${completedCreditReturn.status}`,
  );

  // Verify credit return details (reverse of original CT)
  expect(completedCreditReturn.debtor.xmi).toBe(receiverXmi); // Original receiver becomes debtor
  expect(completedCreditReturn.creditor.xmi).toBe(completedCT.debtor.xmi); // Original sender becomes creditor
  expect(completedCreditReturn.amount).toBe(ctAmount);
  expect(completedCreditReturn.currency).toBe(senderDomesticCurrency);

  console.log("Credit return details verified successfully");

  return {
    acceptResponse,
    approvedRecall,
    recallDetails,
    creditReturnReferenceId,
    completedCreditReturn,
  };
}
