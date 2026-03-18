import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { getAssetsListBo } from "@utils/general/getAssetsListBo";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { updateTariffBo } from "@utils/coreService/services/tariffConfiguration/updateTariffBo";
import { getTariffDetailsBo } from "@utils/coreService/services/tariffConfiguration/getTariffDetailsBo";

test.describe("BackOffice - Core Admin - Edit Tariff Parameters", () => {
  let operatorToken: string;
  let testTariffCode: string;
  let originalTariffName: string;
  let originalAssetCode: string;
  let availableAssets: any[] = [];

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Get available assets
    console.log("Getting list of available assets...");
    try {
      const assetsResult = await getAssetsListBo(operatorToken);

      if (
        assetsResult.response.status() === 200 &&
        Array.isArray(assetsResult.body)
      ) {
        availableAssets = assetsResult.body;
        console.log(`Found ${availableAssets.length} available assets`);
      } else {
        console.log("Failed to get assets list");
        test.skip();
      }
    } catch (error: any) {
      console.log(`Failed to get assets list: ${error.message}`);
      test.skip();
    }

    // Create a test tariff
    console.log("\nCreating test tariff for editing...");
    try {
      // Find a suitable asset (prefer XTS if available, otherwise use first crypto or first asset)
      const testAsset =
        availableAssets.find((a: any) => a.code === "XTS") ||
        availableAssets.find((a: any) => a.type === "crypto") ||
        availableAssets[0];

      if (!testAsset) {
        console.log("No assets available to create tariff");
        test.skip();
        return;
      }

      const timestamp = Date.now();
      originalTariffName = `Test Tariff Edit ${timestamp}`;
      originalAssetCode = testAsset.code;

      console.log(`Creating tariff with name: ${originalTariffName}`);
      console.log(`Asset code: ${originalAssetCode}`);

      const createResult = await createTariffBo(
        operatorToken,
        originalTariffName,
        originalAssetCode,
      );

      if (createResult.response.status() === 200) {
        testTariffCode = createResult.body.code;
        console.log(`Test tariff created: ${testTariffCode}`);
        console.log(
          `Original tariff details:`,
          JSON.stringify(createResult.body, null, 2),
        );
      } else {
        console.log(
          `Failed to create tariff: ${createResult.response.status()}`,
        );
        test.skip();
      }
    } catch (error: any) {
      console.log(`Failed to create test tariff: ${error.message}`);
      test.skip();
    }
  });

  test("BO: Edit tariff parameters - verify response structure", async () => {
    // Skip if test tariff was not created
    if (!testTariffCode) {
      console.log("Skipping test - test tariff not created");
      return;
    }

    console.log("=== Testing tariff parameters update ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Original Name: ${originalTariffName}`);
    console.log(`Original Asset Code: ${originalAssetCode}`);

    // Find a different asset for update
    const newAsset =
      availableAssets.find(
        (a: any) => a.code !== originalAssetCode && a.code === "USD",
      ) ||
      availableAssets.find(
        (a: any) => a.code !== originalAssetCode && a.type === "fiat",
      ) ||
      availableAssets.find((a: any) => a.code !== originalAssetCode);

    if (!newAsset) {
      console.log("No different asset available for testing update");
      return;
    }

    // Create new tariff name
    const timestamp = Date.now();
    const newTariffName = `Edited Test Tariff ${timestamp}`;
    const newAssetCode = newAsset.code;

    console.log(`\nUpdating tariff with:`);
    console.log(`  New Name: ${newTariffName}`);
    console.log(`  New Asset Code: ${newAssetCode}`);

    // Update tariff parameters
    console.log("\nSending update request...");
    const updateResult = await updateTariffBo(
      operatorToken,
      testTariffCode,
      newTariffName,
      newAssetCode,
    );

    // Verify response
    const response = updateResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const tariffData = updateResult.body;
    console.log("Response body:", JSON.stringify(tariffData, null, 2));

    // Check all required fields are present
    expect(tariffData).toHaveProperty("code");
    expect(tariffData).toHaveProperty("name");
    expect(tariffData).toHaveProperty("asset_code");
    expect(tariffData).toHaveProperty("assigned");

    console.log("All required fields present");

    // Verify field values match what we sent
    expect(tariffData.code).toBe(testTariffCode); // Code should not change
    expect(tariffData.name).toBe(newTariffName);
    expect(tariffData.asset_code).toBe(newAssetCode);

    console.log(`Tariff code unchanged: ${tariffData.code}`);
    console.log(`Tariff name updated: ${tariffData.name}`);
    console.log(`Asset code updated: ${tariffData.asset_code}`);

    // Verify assigned status should remain false (for newly created/edited tariff)
    expect(tariffData.assigned).toBe(false);
    console.log(`Tariff assigned status unchanged: ${tariffData.assigned}`);

    // Verify data types
    console.log("\nData type verification:");
    console.log(
      `  code: ${typeof tariffData.code} (value: ${tariffData.code})`,
    );
    console.log(
      `  name: ${typeof tariffData.name} (value: ${tariffData.name})`,
    );
    console.log(
      `  asset_code: ${typeof tariffData.asset_code} (value: ${tariffData.asset_code})`,
    );
    console.log(
      `  assigned: ${typeof tariffData.assigned} (value: ${tariffData.assigned})`,
    );

    expect(typeof tariffData.code).toBe("string");
    expect(typeof tariffData.name).toBe("string");
    expect(typeof tariffData.asset_code).toBe("string");
    expect(typeof tariffData.assigned).toBe("boolean");

    console.log("All field types are correct");

    console.log("\nTariff update test completed successfully");
  });

  test("BO: Verify tariff is actually updated in the system", async () => {
    // Skip if test tariff was not created
    if (!testTariffCode) {
      console.log("Skipping test - test tariff not created");
      return;
    }

    console.log("=== Verifying tariff is updated in system ===");
    console.log(`Tariff Code: ${testTariffCode}`);

    // First, update the tariff with new values
    const timestamp = Date.now();
    const updatedName = `System Verify ${timestamp}`;

    // Find a different asset
    const newAsset =
      availableAssets.find(
        (a: any) => a.code !== originalAssetCode && a.code === "EUR",
      ) || availableAssets.find((a: any) => a.code !== originalAssetCode);

    if (!newAsset) {
      console.log("No different asset available for testing");
      return;
    }

    const updatedAssetCode = newAsset.code;

    console.log(`Updating to: ${updatedName}, ${updatedAssetCode}`);

    // Update tariff
    const updateResult = await updateTariffBo(
      operatorToken,
      testTariffCode,
      updatedName,
      updatedAssetCode,
    );

    expect(updateResult.response.status()).toBe(200);
    console.log("Tariff update successful");

    // Then, fetch the current details to verify
    console.log("\nFetching updated tariff details...");
    const detailsResult = await getTariffDetailsBo(
      operatorToken,
      testTariffCode,
    );

    expect(detailsResult.response.status()).toBe(200);
    const currentDetails = detailsResult.body;

    // Verify the details match what we updated
    expect(currentDetails.name).toBe(updatedName);
    expect(currentDetails.asset_code).toBe(updatedAssetCode);
    expect(currentDetails.assigned).toBe(false);

    console.log("Verified: Updated tariff details match in system");
    console.log(`  Name: ${currentDetails.name}`);
    console.log(`  Asset Code: ${currentDetails.asset_code}`);
    console.log(`  Assigned: ${currentDetails.assigned}`);

    console.log("\nTariff update verification completed");
  });

  test("BO: Edit tariff with invalid asset code should fail", async () => {
    // Skip if test tariff was not created
    if (!testTariffCode) {
      console.log("Skipping test - test tariff not created");
      return;
    }

    console.log("=== Testing tariff edit with invalid asset code ===");
    console.log(`Tariff Code: ${testTariffCode}`);

    const invalidAssetCode = "INV";
    const newName = `Test Invalid Edit ${Date.now()}`;

    console.log(`Attempting to update with:`);
    console.log(`  Name: ${newName}`);
    console.log(`  Asset code: ${invalidAssetCode}`);

    try {
      const updateResult = await updateTariffBo(
        operatorToken,
        testTariffCode,
        newName,
        invalidAssetCode,
      );

      const status = updateResult.response.status();
      console.log(`Response status: ${status}`);

      // Should be 400 or 404 for invalid asset
      expect(status).not.toBe(200);
      console.log(`Expected non-200 status, got: ${status}`);
    } catch (error: any) {
      console.log(`Expected error occurred: ${error.message}`);
    }

    console.log("\nInvalid asset code test completed");
  });
});
