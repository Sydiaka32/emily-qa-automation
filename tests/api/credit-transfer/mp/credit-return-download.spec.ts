import { test, expect } from "@playwright/test";
import { setupCreditReturnDownloadTest } from "@utils/creditTransferService/creditReturn/setupCreditReturnDownloadTest";
import { executeCreditReturnDownloadFlow } from "@utils/creditTransferService/creditReturn/executeCreditReturnDownloadFlow";
import { validateCreditReturnList } from "@utils/creditTransferService/creditReturn/validateCreditReturnList";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";

test.describe("Credit Return - Download Details", () => {
  let testSetup: Awaited<ReturnType<typeof setupCreditReturnDownloadTest>>;

  test.beforeAll(async () => {
    testSetup = await setupCreditReturnDownloadTest();
  });

  test("Download credit return details", async () => {
    const {
      receiverToken,
      creditReturnReferenceId,
      receiverXmi,
      ctAmount,
      senderDomesticCurrency,
      creditReturn, // This is the completed credit return from setup
    } = testSetup;

    console.log(`Credit Return Reference ID: ${creditReturnReferenceId}`);

    // The credit return is already COMPLETED from setup, so no need to wait again
    expect(creditReturn.status).toBe(CreditTransferStatuses.completed);
    console.log(
      `✓ Credit return completed with status: ${creditReturn.status}`,
    );

    // Execute the download flow with the COMPLETED credit return
    console.log(
      "\n=== Executing download flow with completed credit return ===",
    );
    const { targetCreditReturn } = await executeCreditReturnDownloadFlow(
      receiverToken,
      creditReturnReferenceId,
    );

    // Verify the downloaded credit return is also COMPLETED
    expect(targetCreditReturn.status).toBe(CreditTransferStatuses.completed);
    console.log(
      `✓ Downloaded credit return status: ${targetCreditReturn.status}`,
    );

    // Validate credit return list and details using the COMPLETED credit return
    validateCreditReturnList(
      targetCreditReturn, // Use the downloaded credit return for validation
      receiverXmi,
      targetCreditReturn.creditor.xmi,
      ctAmount,
      senderDomesticCurrency,
    );

    console.log("✓ Credit return download test completed successfully");
  });
});
