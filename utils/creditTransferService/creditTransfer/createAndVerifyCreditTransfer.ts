import { getCreditTransferData } from "./getCreditTransferData";
import { createAndInitiateCreditTransfer } from "./createAndInitiateCreditTransfer";
import { verifyCreditTransferCompletion } from "./verifyCreditTransferCompletion";
import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { CreditTransferConfig } from "../../../modules/creditTransfer/creditTransferConfig";
import { CreditTransferResult } from "../../../modules/creditTransfer/CreditTransferResult";

/**
 * Complete credit transfer flow including receiver verification
 * Handles everything from setup to sender & receiver verification
 */
export async function createAndVerifyCreditTransfer(
  config: CreditTransferConfig,
  amountPercentage: number = 0.001,
): Promise<CreditTransferResult> {
  try {
    console.log(
      "Starting complete credit transfer process with verification...",
    );

    // Get all required data for the transfer (this now includes receiverToken)
    const transferData = await getCreditTransferData(config, amountPercentage);

    // Create and initiate the credit transfer
    const { creditTransferValidationId, creditTransferReferenceId } =
      await createAndInitiateCreditTransfer(transferData, config);

    // Expected Result 1: Check CT appeared in the list of sender
    console.log("\n=== Expected Result 1: Verifying CT in sender's list ===");
    const senderCT = await verifyCreditTransferCompletion(
      creditTransferReferenceId,
      transferData.senderToken,
      config.memberXmi,
      transferData.receiverXmi,
      transferData.ctAmount,
      transferData.senderDomesticCurrency,
      SettlementTypes.dns,
      CreditTransferStatuses.completed,
    );
    console.log("CT verified in sender's list");

    // Expected Result 2: Check CT proceed to Completed status on sender side
    console.log("\n=== Expected Result 2: CT completed on sender side ===");
    console.log(`Sender CT Status: ${senderCT.status}`);

    if (senderCT.status !== CreditTransferStatuses.completed) {
      new Error(
        `Credit transfer failed. Expected status COMPLETED but got ${senderCT.status}`,
      );
    }
    console.log("CT completed on sender side");

    // Expected Result 3: Check CT appeared in the list of receiver
    console.log("\n=== Expected Result 3: Verifying CT in receiver's list ===");
    const receiverCT = await verifyCreditTransferCompletion(
      creditTransferReferenceId,
      transferData.receiverToken, // Now we have receiverToken from transferData
      config.memberXmi,
      transferData.receiverXmi,
      transferData.ctAmount,
      transferData.senderDomesticCurrency,
      SettlementTypes.dns,
      CreditTransferStatuses.completed,
    );
    console.log("CT verified in receiver's list");

    // Expected Result 4: Check CT proceed to Completed status on receiver side
    console.log("\n=== Expected Result 4: CT completed on receiver side ===");
    console.log(`Receiver CT Status: ${receiverCT.status}`);

    if (receiverCT.status !== CreditTransferStatuses.completed) {
      new Error(
        `Credit transfer failed on receiver side. Expected status COMPLETED but got ${receiverCT.status}`,
      );
    }
    console.log("CT completed on receiver side");

    // Final summary
    console.log("\n=== CREDIT TRANSFER COMPLETED SUCCESSFULLY ===");
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
    console.error("Error in complete credit transfer process:", error);
    throw error;
  }
}
