import { getCreditTransferData } from "./getCreditTransferData";
import { getSettlementProfile } from "../../clearingService/settlementProfile/getSettlementProfile";
import { verifyRTGSSupport } from "../../clearingService/settlementProfile/verifyRtgsSupport";
import { createAndInitiateRTGSCreditTransfer } from "./createAndInitiateRTGSCreditTransfer";
import { verifyRTGSCreditTransferCompletion } from "./verifyRtgsCreditTransferCompletion";
import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";
import { CreditTransferConfig } from "../../../modules/creditTransfer/creditTransferConfig";
import { RTGSCreditTransferResult } from "../../../modules/creditTransfer/rtgsCreditTransferResult";

/**
 * Complete RTGS credit transfer flow including receiver verification
 * Handles everything from setup to sender & receiver verification for RTGS
 */
export async function createAndVerifyRTGSCreditTransfer(
  config: CreditTransferConfig,
  amountPercentage: number = 0.001,
): Promise<RTGSCreditTransferResult> {
  try {
    console.log(
      "Starting complete RTGS credit transfer process with verification...",
    );

    // Get all required data for the transfer
    const transferData = await getCreditTransferData(config, amountPercentage);

    // RTGS-specific pre-condition: Check RTGS support
    console.log("Checking RTGS support for domestic currency...");
    const settlementProfile = await getSettlementProfile(
      transferData.senderDomesticCurrency,
      transferData.senderToken,
    );
    verifyRTGSSupport(settlementProfile);
    console.log(`RTGS is supported for ${transferData.senderDomesticCurrency}`);

    // Create and initiate the RTGS credit transfer
    const { creditTransferValidationId, creditTransferReferenceId } =
      await createAndInitiateRTGSCreditTransfer(transferData, config);

    // Expected Result 1: Check RTGS CT appeared in the list of sender
    console.log(
      "\n=== Expected Result 1: Verifying RTGS CT in sender's list ===",
    );
    const senderCT = await verifyRTGSCreditTransferCompletion(
      creditTransferReferenceId,
      transferData.senderToken,
      config.memberXmi,
      transferData.receiverXmi,
      transferData.ctAmount,
      transferData.senderDomesticCurrency,
    );
    console.log("RTGS CT verified in sender's list");

    // Expected Result 2: Check CT proceed to SETTLED status on sender side
    console.log("\n=== Expected Result 2: RTGS CT settled on sender side ===");
    console.log(`Sender CT Status: ${senderCT.status}`);

    if (senderCT.status !== CreditTransferStatuses.settled) {
      new Error(
        `RTGS credit transfer failed. Expected status SETTLED but got ${senderCT.status}`,
      );
    }
    console.log("RTGS CT settled on sender side");

    // Expected Result 3: Check CT appeared in the list of receiver
    console.log(
      "\n=== Expected Result 3: Verifying RTGS CT in receiver's list ===",
    );
    const receiverCT = await verifyRTGSCreditTransferCompletion(
      creditTransferReferenceId,
      transferData.receiverToken,
      config.memberXmi,
      transferData.receiverXmi,
      transferData.ctAmount,
      transferData.senderDomesticCurrency,
    );
    console.log("RTGS CT verified in receiver's list");

    // Expected Result 4: Check CT proceed to SETTLED status on receiver side
    console.log(
      "\n=== Expected Result 4: RTGS CT settled on receiver side ===",
    );
    console.log(`Receiver CT Status: ${receiverCT.status}`);

    if (receiverCT.status !== CreditTransferStatuses.settled) {
      new Error(
        `RTGS credit transfer failed on receiver side. Expected status SETTLED but got ${receiverCT.status}`,
      );
    }
    console.log("RTGS CT settled on receiver side");

    // Final summary
    console.log("\n=== RTGS CREDIT TRANSFER COMPLETED SUCCESSFULLY ===");
    console.log(`Reference ID: ${creditTransferReferenceId}`);
    console.log(
      `Amount: ${transferData.ctAmount} ${transferData.senderDomesticCurrency}`,
    );
    console.log(
      `Sender Status: ${senderCT.status}, Receiver Status: ${receiverCT.status}`,
    );

    return {
      referenceId: creditTransferReferenceId,
      validationId: creditTransferValidationId,
      amount: transferData.ctAmount,
      currency: transferData.senderDomesticCurrency,
      status: senderCT.status,
      senderCT,
      receiverCT,
    };
  } catch (error) {
    console.error("Error in complete RTGS credit transfer process:", error);
    throw error;
  }
}
