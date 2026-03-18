import { test, expect } from "@playwright/test";
import { createCompletedCctTransaction } from "@utils/creditTransferService/creditTransfer/createCompletedCctTransaction";
import { downloadCTDetails } from "@utils/creditTransferService/creditTransfer/downloadCreditTransferDetails";

test.describe("Credit Transfer - Download Details", () => {
  let testSetup: Awaited<ReturnType<typeof createCompletedCctTransaction>>;

  test.beforeAll(async () => {
    // Pre-condition: Create a completed CT using the utility function
    console.log("Creating completed credit transfer for download test...");
    testSetup = await createCompletedCctTransaction();
    console.log(`Created CT with reference ID: ${testSetup.referenceId}`);
  });

  test("Download CT details from created transfer", async () => {
    const { referenceId, senderToken } = testSetup;

    // Download CT details using the created transaction
    console.log(`Downloading CT details for ${referenceId}...`);
    const downloadResult = await downloadCTDetails(referenceId, senderToken);

    // Verify download was successful
    expect(downloadResult.response.status()).toBe(200);
    expect(downloadResult.body).toBeDefined();
    expect(downloadResult.body.length).toBeGreaterThan(100);

    console.log(`Successfully downloaded CT details for ${referenceId}`);
  });
});
