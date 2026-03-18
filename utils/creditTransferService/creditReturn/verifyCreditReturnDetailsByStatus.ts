import { expect } from "@playwright/test";
import { CreditTransferTypes } from "../../../consts/credit-transfer/creditTransferTypes";

/**
 * Verify credit return basic details without status checking
 */
export function verifyCreditReturnBasicDetails(
  creditReturn: any,
  originalCT: any,
): void {
  console.log("=== Verifying credit return basic details ===");

  // Verify credit return type
  expect(creditReturn.type).toBe(CreditTransferTypes.creditReturn);

  // Verify debtor and creditor are reversed compared to original CT
  expect(creditReturn.debtor.xmi).toBe(originalCT.creditor.xmi);
  expect(creditReturn.creditor.xmi).toBe(originalCT.debtor.xmi);

  // Verify amount and currency match original CT
  expect(creditReturn.amount).toBe(originalCT.amount);
  expect(creditReturn.currency).toBe(originalCT.currency);

  // Verify tx_id matches original CT
  expect(creditReturn.tx_id).toBe(originalCT.tx_id);

  // Verify credit return has required properties
  expect(creditReturn).toHaveProperty("reference_id");
  expect(creditReturn).toHaveProperty("end_to_end_id");
  expect(creditReturn).toHaveProperty("created_at");
  expect(creditReturn).toHaveProperty("updated_at");

  console.log("Credit return basic details verified successfully");
}
