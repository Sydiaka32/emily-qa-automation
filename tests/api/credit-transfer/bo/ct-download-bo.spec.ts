import { test, expect } from "@playwright/test";
import { createCompletedCctTransaction } from "@utils/creditTransferService/creditTransfer/createCompletedCctTransaction";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { downloadCTDetailsBo } from "@utils/creditTransferService/creditTransfer/bo/downloadCtDetailsBo";

test.describe("BackOffice - Credit Transfer - Download Details", () => {
  let testSetup: Awaited<ReturnType<typeof createCompletedCctTransaction>>;
  let operatorToken: string;
  const url = config.backofficeBaseUrl;

  test.beforeAll(async () => {
    // Pre-condition: Create a completed CT using the utility function
    console.log("Creating completed credit transfer for download test...");
    testSetup = await createCompletedCctTransaction();
    console.log(`Created CT with reference ID: ${testSetup.referenceId}`);

    // Get token for the operator
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("BackOffice - Download CT details from created transfer", async () => {
    const { referenceId } = testSetup;

    // Download CT details using the created transaction
    console.log(`Downloading CT details for ${referenceId}...`);
    const downloadResult = await downloadCTDetailsBo(
      referenceId,
      operatorToken,
      url,
    );

    // Verify download was successful
    expect(downloadResult.response.status()).toBe(200);
    expect(downloadResult.body).toBeDefined();
    expect(downloadResult.body.length).toBeGreaterThan(100);

    console.log(`Successfully downloaded CT details for ${referenceId}`);
  });
});
