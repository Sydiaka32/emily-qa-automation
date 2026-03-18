import { createAndValidateCreditTransfer } from "./createAndValidateCreditTransfer";
import { initiateCreditTransfer } from "./initiateCreditTransfer";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { CreditTransferData } from "../../../modules/creditTransfer/creditTransferData";
import { CreditTransferConfig } from "../../../modules/creditTransfer/creditTransferConfig";
import { TransferExecutionResult } from "../../../modules/creditTransfer/transferExecutionResult";

/**
 * Creates and initiates an RTGS credit transfer using prepared data
 */
export async function createAndInitiateRTGSCreditTransfer(
  transferData: CreditTransferData,
  config: CreditTransferConfig,
): Promise<TransferExecutionResult> {
  const {
    senderToken,
    senderDomesticCurrency,
    ctAmount,
    receiverXmi,
    creditor,
  } = transferData;

  console.log("Creating RTGS credit transfer...");
  const createResult = await createAndValidateCreditTransfer({
    creditorXmi: receiverXmi,
    creditorCurrency: senderDomesticCurrency,
    creditorAmount: ctAmount,
    settlementType: SettlementTypes.rtgs,
    debtorXmi: config.memberXmi,
    token: senderToken,
    debtorName: "Test Debtor Bank",
    creditorName: creditor.name,
    remittanceInformation: "API Test - RTGS Domestic Currency CT",
  });

  const creditTransferValidationId = createResult.validationId;
  console.log(
    `RTGS credit transfer created with validation ID: ${creditTransferValidationId}`,
  );

  // Step 3: Initiate (approve) credit transfer
  console.log("Initiating RTGS credit transfer...");
  const initiateResult = await initiateCreditTransfer(
    creditTransferValidationId,
    senderToken,
  );
  console.log(
    "Initiate response body:",
    JSON.stringify(initiateResult.body, null, 2),
  );
  const creditTransferReferenceId = initiateResult.referenceId;
  console.log(
    `RTGS credit transfer initiated with reference ID: ${creditTransferReferenceId}`,
  );

  return {
    creditTransferValidationId,
    creditTransferReferenceId,
  };
}
