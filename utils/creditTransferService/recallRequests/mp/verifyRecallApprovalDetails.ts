import { expect } from "@playwright/test";
import { RecallStatuses } from "../../../../consts/credit-transfer/recallStatuses";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";

/**
 * Verifies recall approval details including credit return creation
 */
export function verifyRecallApprovalDetails(
  recallDetails: any,
  creditReturn: any,
  recallId: number,
  expectedCreditTransferReferenceId: string,
  expectedReceiverXmi: string,
  expectedSenderXmi: string,
  expectedAmount: number,
  expectedCurrency: string,
): void {
  console.log("\n=== Verifying recall approval details ===");

  // Verify recall details
  expect(recallDetails.clr_sys_ref).toBe(expectedCreditTransferReferenceId);
  expect(recallDetails.recall_status).toBe(RecallStatuses.approved);

  // Verify origin transaction matches original CT
  expect(recallDetails.origin_transaction.clr_sys_ref).toBe(
    expectedCreditTransferReferenceId,
  );

  // Verify return transaction exists
  expect(recallDetails.return_transaction).toBeDefined();
  expect(recallDetails.return_transaction.clr_sys_ref).toBeDefined();

  // Verify credit return details
  expect(creditReturn.debtor.xmi).toBe(expectedReceiverXmi);
  expect(creditReturn.creditor.xmi).toBe(expectedSenderXmi);
  expect(creditReturn.amount).toBe(expectedAmount);
  expect(creditReturn.currency).toBe(expectedCurrency);
  expect(creditReturn.status).toBe(CreditTransferStatuses.completed);

  console.log(
    "Recall approval and credit return details verified successfully",
  );
}
