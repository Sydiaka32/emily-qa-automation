import { expect } from "@playwright/test";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { CreditTransferTypes } from "../../../consts/credit-transfer/creditTransferTypes";
import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";
import { waitForCreditTransferStatus } from "./waitForCreditTransferStatus";

export async function verifyRtgsCreditTransferInHistory(
  referenceId: string,
  senderToken: string,
  expected: {
    ctAmount: number;
    domesticCurrency: string;
    debtorXmi: string;
    creditorXmi: string;
  },
  expectedStatus: string = CreditTransferStatuses.completed,
): Promise<any> {
  console.log("Verifying transaction in history...");

  // Wait for credit transfer to reach expected status
  console.log(
    `Waiting for transaction ${referenceId} to reach status: ${expectedStatus}`,
  );
  const transaction = await waitForCreditTransferStatus(
    referenceId,
    expectedStatus,
    senderToken,
    30,
    500,
  );

  console.log(
    "Transaction History Response:",
    JSON.stringify(transaction, null, 2),
  );

  // Validate transaction details
  expect(transaction.reference_id).toBe(referenceId);
  expect(transaction.type).toBe(CreditTransferTypes.creditTransfer);
  expect(transaction.status).toBe(expectedStatus);
  expect(transaction.amount).toBe(expected.ctAmount);
  expect(transaction.currency).toBe(expected.domesticCurrency);
  expect(transaction.settlement_type).toBe(SettlementTypes.rtgs);
  expect(transaction.debtor.xmi).toBe(expected.debtorXmi);
  expect(transaction.creditor.xmi).toBe(expected.creditorXmi);

  console.log("Transaction verified in history successfully!");
  return transaction;
}
