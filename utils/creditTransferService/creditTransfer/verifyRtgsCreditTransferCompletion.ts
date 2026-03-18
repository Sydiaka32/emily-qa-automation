import { findCreditTransferByReferenceId } from "./findCreditTransferByReferenceId";
import { verifyCreditTransferDetails } from "./verifyCreditTransferDetails";
import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { waitForCreditTransferStatus } from "@utils/creditTransferService/creditTransfer/waitForCreditTransferStatus";

/**
 * Combined function to verify RTGS CT in list and wait for SETTLED status
 */
export async function verifyRTGSCreditTransferCompletion(
  referenceId: string,
  token: string,
  expectedDebtorXmi: string,
  expectedCreditorXmi: string,
  expectedAmount: number,
  expectedCurrency: string,
): Promise<any> {
  // Wait for CT to appear in list
  console.log(
    `Verifying RTGS credit transfer ${referenceId} appears in list...`,
  );
  const creditTransfer = await findCreditTransferByReferenceId(
    referenceId,
    token,
  );

  // Verify details including RTGS settlement type
  verifyCreditTransferDetails(
    creditTransfer,
    referenceId,
    expectedDebtorXmi,
    expectedCreditorXmi,
    expectedAmount,
    expectedCurrency,
    SettlementTypes.rtgs, // Expect RTGS settlement type
  );
  const expectedStatus = CreditTransferStatuses.settled;
  // Wait for SETTLED status (specific for RTGS)
  console.log(`Waiting for RTGS credit transfer to reach SETTLED status...`);
  const settledCT = await waitForCreditTransferStatus(
    referenceId,
    expectedStatus,
    token,
    30,
    500,
  );

  console.log(
    `RTGS credit transfer ${referenceId} successfully reached SETTLED status`,
  );
  return settledCT;
}
