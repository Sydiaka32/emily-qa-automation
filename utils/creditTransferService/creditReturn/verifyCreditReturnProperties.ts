import { expect } from "@playwright/test";
import { CreditTransferTypes } from "../../../consts/credit-transfer/creditTransferTypes";
import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";

/**
 * Verifies specific credit return properties beyond basic details
 */
export function verifyCreditReturnProperties(
  creditReturn: any,
  expectedAmount: number,
  expectedCurrency: string,
  expectedReceiverXmi: string,
  expectedSenderXmi: string,
  originalTxId: string,
): void {
  // Verify reference ID exists
  expect(creditReturn.reference_id).toBeDefined();

  // Verify type and status
  expect(creditReturn.type).toBe(CreditTransferTypes.creditReturn);
  expect(creditReturn.status).toBe(CreditTransferStatuses.completed);

  // Verify debtor and creditor are reversed
  expect(creditReturn.debtor.xmi).toBe(expectedReceiverXmi);
  expect(creditReturn.creditor.xmi).toBe(expectedSenderXmi);

  // Verify financial details match
  expect(creditReturn.amount).toBe(expectedAmount);
  expect(creditReturn.currency).toBe(expectedCurrency);
  expect(creditReturn.settlement_type).toBe(SettlementTypes.dns);

  // Verify tx_id matches original CT
  expect(creditReturn.tx_id).toBe(originalTxId);

  // Verify operational properties
  expect(creditReturn.allow_cancel).toBe(false);
  expect(creditReturn.allow_recall).toBe(false);
  expect(creditReturn.allow_return).toBe(false);

  console.log("Credit return specific properties verified successfully");
}
