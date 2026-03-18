import { expect } from "@playwright/test";
import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";
import { CreditTransferTypes } from "../../../consts/credit-transfer/creditTransferTypes";

/**
 * Verify credit return details in COMPLETED state
 */
export function verifyCompletedCreditReturnDetails(
  creditReturn: any,
  originalCT: any,
): void {
  console.log("=== Verifying credit return details ===");
  console.log(`Credit return status: ${creditReturn.status}`);

  // Verify credit return type
  expect(creditReturn.type).toBe(CreditTransferTypes.creditReturn);

  // Verify status is COMPLETED
  expect(creditReturn.status).toBe(CreditTransferStatuses.completed);

  // Verify debtor and creditor are reversed compared to original CT
  expect(creditReturn.debtor.xmi).toBe(originalCT.creditor.xmi); // Original creditor becomes debtor
  expect(creditReturn.creditor.xmi).toBe(originalCT.debtor.xmi); // Original debtor becomes creditor

  // Verify amount and currency match original CT
  expect(creditReturn.amount).toBe(originalCT.amount);
  expect(creditReturn.currency).toBe(originalCT.currency);

  // Verify settlement type matches
  expect(creditReturn.settlement_type).toBe(originalCT.settlement_type);

  // Verify tx_id matches original CT (as per your example)
  expect(creditReturn.tx_id).toBe(originalCT.tx_id);

  // Verify credit return has required properties
  expect(creditReturn).toHaveProperty("reference_id");
  expect(creditReturn).toHaveProperty("end_to_end_id");
  expect(creditReturn).toHaveProperty("created_at");
  expect(creditReturn).toHaveProperty("updated_at");
  expect(creditReturn).toHaveProperty("completed_at");

  console.log("Credit return details verified successfully");
}
