import { test, expect } from "@playwright/test";
import { executeRTGSCreditReturnFlow } from "@utils/creditTransferService/creditReturn/executeRTGSCreditReturn";
import { verifyRTGSCreditReturnProperties } from "@utils/creditTransferService/creditReturn/verifyRTGSCreditReturnProperties";
import { waitForCreditReturnCompleted } from "@utils/creditTransferService/creditReturn/waitForCreditReturnCompleted";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { SettlementTypes } from "../../../../consts/clearing/settlementTypes";
import { CreditTransferTypes } from "../../../../consts/credit-transfer/creditTransferTypes";
import { createSettledRtgsTransaction } from "@utils/creditTransferService/creditTransfer/createSettledRtgsTransaction";

test.describe("Credit Return Initiation by Receiver - RTGS", () => {
  let testSetup: Awaited<ReturnType<typeof createSettledRtgsTransaction>>;

  test.beforeAll(async () => {
    // Create a settled RTGS transaction as precondition
    testSetup = await createSettledRtgsTransaction();
  });

  test("Initiate credit return as receiver for RTGS CT and verify creation", async () => {
    const {
      referenceId: creditTransferReferenceId,
      receiverToken,
      ctAmount,
      domesticCurrency: senderDomesticCurrency,
      receiverTransaction,
    } = testSetup;

    // Extract the original transaction ID from the settled transaction
    const originalTxId = receiverTransaction.tx_id || receiverTransaction.id;
    const receiverXmi = receiverTransaction.creditor?.xmi;
    const settledCT = receiverTransaction;

    // Execute the complete credit return flow for RTGS
    const { creditReturnResponse, creditReturn } =
      await executeRTGSCreditReturnFlow(
        creditTransferReferenceId,
        receiverToken,
        originalTxId,
      );

    // Verify credit return response
    expect(creditReturnResponse.status).toBe(200);
    console.log("Credit return initiated successfully - Status 200");
    console.log(`Credit return initial status: ${creditReturn.status}`);

    // Wait for credit return to reach COMPLETED status
    console.log("\n=== Waiting for credit return to complete ===");
    const completedCreditReturn = await waitForCreditReturnCompleted(
      creditReturn.reference_id,
      receiverToken,
      60,
      1000,
    );

    console.log(
      `Credit return completed with status: ${completedCreditReturn.status}`,
    );

    // Verify credit return details in COMPLETED state
    console.log("\n=== Verifying credit return in COMPLETED state ===");

    // Use a simple verification that only checks COMPLETED status
    expect(completedCreditReturn.status).toBe(CreditTransferStatuses.completed);
    expect(completedCreditReturn.type).toBe(CreditTransferTypes.creditReturn);
    expect(completedCreditReturn.debtor.xmi).toBe(settledCT.creditor.xmi);
    expect(completedCreditReturn.creditor.xmi).toBe(settledCT.debtor.xmi);
    expect(completedCreditReturn.amount).toBe(settledCT.amount);
    expect(completedCreditReturn.currency).toBe(settledCT.currency);
    expect(completedCreditReturn.settlement_type).toBe(SettlementTypes.dns);
    expect(completedCreditReturn.tx_id).toBe(originalTxId);
    expect(completedCreditReturn.completed_at).toBeDefined();

    console.log("Credit return basic details verified successfully");

    // Verify specific RTGS credit return properties
    verifyRTGSCreditReturnProperties(
      completedCreditReturn,
      ctAmount,
      senderDomesticCurrency,
      receiverXmi,
      settledCT.debtor.xmi,
      originalTxId,
    );

    console.log(
      `Credit return reference ID: ${completedCreditReturn.reference_id}`,
    );
    console.log(
      `Credit return completed at: ${completedCreditReturn.completed_at}`,
    );
    console.log(
      `Credit return settlement type: ${completedCreditReturn.settlement_type}`,
    );
  });
});
