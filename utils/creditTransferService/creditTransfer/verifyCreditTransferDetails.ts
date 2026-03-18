import { expect } from "@playwright/test";

/**
 * Verify credit transfer details match expected values
 */
export function verifyCreditTransferDetails(
  creditTransfer: any,
  expectedReferenceId: string,
  expectedDebtorXmi: string,
  expectedCreditorXmi: string,
  expectedAmount: number,
  expectedCurrency: string,
  expectedSettlementType: string,
): void {
  expect(creditTransfer.reference_id).toBe(expectedReferenceId);
  expect(creditTransfer.debtor.xmi).toBe(expectedDebtorXmi);
  expect(creditTransfer.creditor.xmi).toBe(expectedCreditorXmi);
  expect(creditTransfer.amount).toBe(expectedAmount);
  expect(creditTransfer.currency).toBe(expectedCurrency);
  expect(creditTransfer.settlement_type).toBe(expectedSettlementType);

  console.log("Credit transfer details verified successfully");
}
