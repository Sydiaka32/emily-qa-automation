import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";
import { findCreditTransferByReferenceId } from "./findCreditTransferByReferenceId";
import { verifyCreditTransferDetails } from "./verifyCreditTransferDetails";
import { waitForCreditTransferStatus } from "./waitForCreditTransferStatus";

/**
 * Combined function to verify CT in list and wait for status
 */
export async function verifyCreditTransferCompletion(
  referenceId: string,
  token: string,
  expectedDebtorXmi: string,
  expectedCreditorXmi: string,
  expectedAmount: number,
  expectedCurrency: string,
  expectedSettlementType: string,
  expectedStatus: string = CreditTransferStatuses.completed,
): Promise<any> {
  // Wait for CT to appear in list
  console.log(`Verifying credit transfer ${referenceId} appears in list...`);
  const creditTransfer = await findCreditTransferByReferenceId(
    referenceId,
    token,
  );

  // Verify details
  verifyCreditTransferDetails(
    creditTransfer,
    referenceId,
    expectedDebtorXmi,
    expectedCreditorXmi,
    expectedAmount,
    expectedCurrency,
    expectedSettlementType,
  );

  // Wait for expected status
  console.log(
    `Waiting for credit transfer to reach ${expectedStatus} status...`,
  );
  const completedCT = await waitForCreditTransferStatus(
    referenceId,
    expectedStatus,
    token,
  );

  console.log(
    `Credit transfer ${referenceId} successfully reached ${expectedStatus} status`,
  );
  return completedCT;
}
