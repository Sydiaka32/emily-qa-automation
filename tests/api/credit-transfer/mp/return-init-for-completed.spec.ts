import { test, expect } from "@playwright/test";
import { createCompletedCctTransaction } from "@utils/creditTransferService/creditTransfer/createCompletedCctTransaction";
import { executeCreditReturnFlow } from "@utils/creditTransferService/creditReturn/executeCreditReturnFlow";
import { verifyCreditReturnProperties } from "@utils/creditTransferService/creditReturn/verifyCreditReturnProperties";
import { waitForCreditReturnCompleted } from "@utils/creditTransferService/creditReturn/waitForCreditReturnCompleted";

test.describe("Credit Return Initiation by Receiver", () => {
  let testSetup: Awaited<ReturnType<typeof createCompletedCctTransaction>>;

  test.beforeAll(async () => {
    // Create a completed CCT transaction as precondition
    testSetup = await createCompletedCctTransaction();
  });

  test("Initiate credit return as receiver and verify creation", async () => {
    const {
      referenceId: creditTransferReferenceId,
      receiverToken,
      ctAmount,
      domesticCurrency: senderDomesticCurrency,
      receiverTransaction,
    } = testSetup;

    // Extract the original transaction ID from the completed transaction
    const originalTxId = receiverTransaction.tx_id || receiverTransaction.id;
    const receiverXmi = receiverTransaction.creditor?.xmi;
    const completedCT = receiverTransaction;

    // Execute the complete credit return flow
    const { creditReturnResponse, creditReturn } =
      await executeCreditReturnFlow(
        creditTransferReferenceId,
        receiverToken,
        originalTxId,
        completedCT,
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
      30,
      500,
    );

    console.log(
      `Credit return completed with status: ${completedCreditReturn.status}`,
    );

    // Verify specific credit return properties
    verifyCreditReturnProperties(
      completedCreditReturn,
      ctAmount,
      senderDomesticCurrency,
      receiverXmi,
      completedCT.debtor.xmi,
      originalTxId,
    );

    console.log(
      `Credit return reference ID: ${completedCreditReturn.reference_id}`,
    );
    console.log(
      `Credit return completed at: ${completedCreditReturn.completed_at}`,
    );
  });
});
