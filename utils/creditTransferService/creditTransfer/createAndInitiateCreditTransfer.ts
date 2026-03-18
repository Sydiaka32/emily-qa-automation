import { createAndValidateCreditTransfer } from "./createAndValidateCreditTransfer";
import { initiateCreditTransfer } from "./initiateCreditTransfer";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { CreditTransferData } from "../../../modules/creditTransfer/creditTransferData";
import { CreditTransferConfig } from "../../../modules/creditTransfer/creditTransferConfig";
import { TransferExecutionResult } from "../../../modules/creditTransfer/transferExecutionResult";

/**
 * Creates and initiates a credit transfer using prepared data
 */
export async function createAndInitiateCreditTransfer(
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

  console.log("Creating credit transfer...");
  const createResult = await createAndValidateCreditTransfer({
    creditorXmi: receiverXmi,
    creditorCurrency: senderDomesticCurrency,
    creditorAmount: ctAmount,
    settlementType: SettlementTypes.dns,
    debtorXmi: config.memberXmi,
    token: senderToken,
    debtorName: "Test Debtor Bank",
    creditorName: creditor.name,
    remittanceInformation: "API Test - Domestic Currency CT",
  });

  const creditTransferValidationId = createResult.validationId;
  console.log(
    `Credit transfer created with validation ID: ${creditTransferValidationId}`,
  );

  // Step 3: Initiate (approve) credit transfer
  console.log("Initiating credit transfer...");
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
    `Credit transfer initiated with reference ID: ${creditTransferReferenceId}`,
  );

  return {
    creditTransferValidationId,
    creditTransferReferenceId,
  };
}
