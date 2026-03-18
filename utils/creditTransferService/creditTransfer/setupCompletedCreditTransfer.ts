import { config } from "../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { createAndVerifyCreditTransfer } from "./createAndVerifyCreditTransfer";
import { CompletedCreditTransferSetup } from "../../../modules/creditTransfer/completedCreditTransferSetup";
import { CreditTransferConfig } from "../../../modules/creditTransfer/creditTransferConfig";

/**
 * Sets up a completed credit transfer for testing credit returns
 */
export async function setupCompletedCreditTransfer(): Promise<CompletedCreditTransferSetup> {
  console.log("Setting up completed credit transfer for return testing...");

  // Get authentication tokens
  const [senderToken, receiverToken, operatorToken] = await Promise.all([
    getAccessToken(config.memberName, config.password),
    getAccessToken(config.receiverName, config.password),
    getOperatorToken(config.operatorName, config.password),
  ]);

  console.log("All tokens obtained successfully");

  // Setup and execute credit transfer using the reusable utility
  const ctConfig: CreditTransferConfig = {
    memberName: config.memberName,
    password: config.password,
    receiverName: config.receiverName,
    operatorName: config.operatorName,
    memberXmi: config.memberXmi,
    receiverXmi: config.receiverXmi,
    makerName: config.makerName,
  };

  const ctResult = await createAndVerifyCreditTransfer(ctConfig, 0.001);

  return {
    senderToken,
    receiverToken,
    operatorToken,
    creditTransferReferenceId: ctResult.referenceId,
    completedCT: ctResult.senderCT,
    senderDomesticCurrency: ctResult.currency,
    ctAmount: ctResult.amount,
    receiverXmi: config.receiverXmi,
    originalTxId: ctResult.senderCT.tx_id,
  };
}
