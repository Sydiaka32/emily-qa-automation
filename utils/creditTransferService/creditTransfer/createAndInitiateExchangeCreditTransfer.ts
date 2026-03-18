import { createAndValidateCreditTransfer } from "./createAndValidateCreditTransfer";
import { initiateCreditTransfer } from "./initiateCreditTransfer";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { ExchangeCreditTransferData } from "../../../modules/creditTransfer/exchangeCreditTransferData";
import { CreditTransferConfig } from "../../../modules/creditTransfer/creditTransferConfig";
import { TransferExecutionResult } from "../../../modules/creditTransfer/transferExecutionResult";

/**
 * Creates and initiates an exchange credit transfer
 */
export async function createAndInitiateExchangeCreditTransfer(
  exchangeData: ExchangeCreditTransferData,
  config: CreditTransferConfig,
): Promise<TransferExecutionResult> {
  const { senderToken, exchangeAsset, ctAmount, receiverXmi, creditor } =
    exchangeData;

  console.log("Creating credit transfer with exchange...");
  const createResult = await createAndValidateCreditTransfer({
    creditorXmi: receiverXmi,
    creditorCurrency: exchangeAsset,
    creditorAmount: ctAmount,
    settlementType: SettlementTypes.dns,
    debtorXmi: config.memberXmi,
    token: senderToken,
    debtorName: "Test Debtor Bank",
    creditorName: creditor.name,
    remittanceInformation: "API Test - CT with Exchange",
  });

  console.log("=== DEBUG: Credit transfer creation result ===");
  console.log(JSON.stringify(createResult, null, 2));

  const creditTransferValidationId = createResult.validationId;
  console.log(
    `Credit transfer created with validation ID: ${creditTransferValidationId}`,
  );

  console.log("Initiating credit transfer with exchange...");
  const initiateResult = await initiateCreditTransfer(
    creditTransferValidationId,
    senderToken,
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
