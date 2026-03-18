import { CreditTransferTypes } from "../../../consts/credit-transfer/creditTransferTypes";
import { expect } from "@playwright/test";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";

/**
 * Validates the credit return list structure and target credit return details
 * WITHOUT status check - status should be verified separately after waiting
 */
export function validateCreditReturnList(
  targetCreditReturn: any,
  receiverXmi: string,
  senderXmi: string,
  ctAmount: number,
  senderDomesticCurrency: string,
): void {
  console.log("\n=== Validating credit return list and details ===");

  // Verify credit return structure matches expected format
  expect(targetCreditReturn.type).toBe(CreditTransferTypes.creditReturn);

  expect(targetCreditReturn.pending_status).toBeNull();
  expect(targetCreditReturn.debtor.xmi).toBe(receiverXmi);
  expect(targetCreditReturn.creditor.xmi).toBe(senderXmi);
  expect(targetCreditReturn.amount).toBe(ctAmount);
  expect(targetCreditReturn.currency).toBe(senderDomesticCurrency);
  expect(targetCreditReturn.settlement_type).toBe(SettlementTypes.dns);
  expect(targetCreditReturn.allow_cancel).toBe(false);
  expect(targetCreditReturn.allow_recall).toBe(false);
  expect(targetCreditReturn.allow_return).toBe(false);

  console.log("Credit return list validation completed successfully");
}
