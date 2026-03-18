import { expect } from "@playwright/test";
import { postRequest, getRequest } from "@utils/apiUtils";
import { findCreditTransferByReferenceId } from "../../creditTransfer/findCreditTransferByReferenceId";
import { waitForCreditTransferStatus } from "../../creditTransfer/waitForCreditTransferStatus";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { config } from "../../../../test.config";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";
import { waitForRecallStatusBo } from "@utils/creditTransferService/recallRequests/bo/waitForRecallStatusBo";

/**
 * Executes the complete recall approval flow including acceptance and credit return verification via Back Office
 */
export async function executeRecallApprovalFlowBo(
  recallId: number,
  operatorToken: string,
  creditTransferReferenceId: string,
  completedCT: any,
  receiverXmi: string,
  ctAmount: number,
  senderDomesticCurrency: string,
  receiverToken: string,
): Promise<any> {
  console.log("\n=== Executing BO recall approval flow ===");

  // Step 1: Accept recall as BO operator
  console.log(`Accepting recall with ID: ${recallId} via BO`);

  const acceptPayload = {
    reason_code: "ACPT",
    reason_info: "Approved by Back Office operator",
  };

  console.log("Accept payload:", JSON.stringify(acceptPayload, null, 2));
  console.log(
    "Using operator token (first 20 chars):",
    operatorToken.substring(0, 20) + "...",
  );

  const { response: acceptResponse, body: acceptBody } = await postRequest(
    `/api/v1/ct-admin/recalls/${recallId}/accept`,
    acceptPayload,
    operatorToken,
    config.backofficeBaseUrl,
  );

  // Verify accept response
  console.log("Accept response status:", acceptResponse.status());
  console.log("Accept response body:", acceptBody);

  expect(acceptResponse.status()).toBe(200);
  console.log("BO Recall accepted successfully - Status 200");

  // Step 2: Check that recall status becomes APPROVED via BO
  console.log("\n=== Verifying recall status becomes APPROVED via BO ===");

  const approvedRecall = await waitForRecallStatusBo(
    recallId,
    operatorToken,
    RecallStatuses.approved,
    30,
    500,
  );

  console.log("Approved recall:", approvedRecall);
  expect(approvedRecall.recall_status).toBe(RecallStatuses.approved);
  console.log(`Recall status verified: ${approvedRecall.recall_status}`);

  // Step 3: Get recall details via BO and verify structure
  console.log(
    "\n=== Getting recall details via BO and verifying structure ===",
  );

  const { response: recallDetailsResponse, body: recallDetails } =
    await getRequest(
      `/api/v1/ct-admin/recalls/${recallId}`,
      operatorToken,
      config.backofficeBaseUrl,
    );

  expect(recallDetailsResponse.status()).toBe(200);
  console.log("BO Recall details retrieved successfully");

  console.log("Recall details:", JSON.stringify(recallDetails, null, 2));

  // Verify the recall details structure
  expect(recallDetails.id).toBe(recallId);
  expect(recallDetails.recall_id).toBeDefined();
  expect(recallDetails.recall_requested_at).toBeDefined();
  expect(recallDetails.recall_updated_at).toBeDefined();
  expect(recallDetails.clr_sys_ref).toBe(creditTransferReferenceId);
  expect(recallDetails.recall_status).toBe(RecallStatuses.approved);

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

  // Step 4: Find credit return and verify it exists (via MP endpoint)
  console.log("\n=== Finding and verifying credit return ===");
  console.log(`Verifying credit return: ${creditReturnReferenceId}`);

  const creditReturn = await findCreditTransferByReferenceId(
    creditReturnReferenceId,
    receiverToken,
  );

  expect(creditReturn).toBeDefined();
  console.log(`Credit return found with status: ${creditReturn.status}`);

  // Step 5: Wait for credit return to reach COMPLETED status (via MP endpoint)
  console.log("Waiting for credit return to complete...");
  const completedCreditReturn = await waitForCreditTransferStatus(
    creditReturnReferenceId,
    CreditTransferStatuses.completed, // Hardcoded status
    receiverToken,
  );

  console.log(
    `Credit return completed with status: ${completedCreditReturn.status}`,
  );

  // Step 6: Verify credit return details (reverse of original CT)
  expect(completedCreditReturn.debtor.xmi).toBe(receiverXmi);
  expect(completedCreditReturn.creditor.xmi).toBe(completedCT.debtor.xmi);
  expect(completedCreditReturn.amount).toBe(ctAmount);
  expect(completedCreditReturn.currency).toBe(senderDomesticCurrency);

  console.log("Credit return details verified successfully");

  return {
    acceptResponse: { status: acceptResponse.status(), body: acceptBody },
    approvedRecall,
    recallDetails,
    creditReturnReferenceId,
    completedCreditReturn,
  };
}
