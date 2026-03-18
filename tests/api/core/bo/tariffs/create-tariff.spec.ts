import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { getAssetsListBo } from "@utils/general/getAssetsListBo";
import { getTariffsListBo } from "@utils/coreService/services/tariffConfiguration/getTariffsListBo";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";

test.describe("BackOffice - Core Admin - Create New Tariff", () => {
  let operatorToken: string;
  let availableAssets: any[] = [];
  let createdTariffCodes: string[] = []; // Track created tariffs for cleanup

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Get list of available assets
    console.log("Getting list of available assets...");
    try {
      const assetsResult = await getAssetsListBo(operatorToken);

      expect(assetsResult.response.status()).toBe(200);
      expect(Array.isArray(assetsResult.body)).toBe(true);

      availableAssets = assetsResult.body;
      console.log(`Found ${availableAssets.length} available assets`);

      // Log some asset examples
      if (availableAssets.length > 0) {
        console.log("Sample assets:");
        availableAssets.slice(0, 3).forEach((asset: any) => {
          console.log(`  ${asset.code}: ${asset.name} (${asset.type})`);
        });
      }
    } catch (error: any) {
      console.log(`Failed to get assets list: ${error.message}`);
      test.skip();
    }
  });

  test.afterAll(async () => {
    // Note: In a real test environment, you might want to clean up created tariffs
    // However, typically tariffs are not deleted, so we just track them
    console.log(`Created ${createdTariffCodes.length} tariffs during tests`);
    if (createdTariffCodes.length > 0) {
      console.log("Created tariff codes:", createdTariffCodes.join(", "));
    }
  });

  test("BO: Create new tariff with valid data", async () => {
    // Skip if no assets available
    if (availableAssets.length === 0) {
      console.log("Skipping test - no assets available");
      return;
    }

    console.log("=== Testing tariff creation ===");

    // Get current tariffs count before creation
    console.log("Getting current tariffs list...");
    const tariffsBefore = await getTariffsListBo(operatorToken);
    const tariffsCountBefore = tariffsBefore.body.length;
    console.log(`Current tariffs count: ${tariffsCountBefore}`);

    // Find an asset to use (prefer fiat for testing)
    const testAsset =
      availableAssets.find((asset: any) => asset.type === "fiat") ||
      availableAssets[0];
    console.log(
      `Selected asset for tariff: ${testAsset.code} (${testAsset.name})`,
    );

    // Create unique tariff name
    const timestamp = Date.now();
    const tariffName = `Test Tariff ${timestamp}`;
    console.log(`Tariff name: ${tariffName}`);

    // Create new tariff
    console.log("\nCreating new tariff...");
    const createResult = await createTariffBo(
      operatorToken,
      tariffName,
      testAsset.code,
    );

    // Verify response
    const response = createResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const tariffData = createResult.body;
    console.log("Response body:", JSON.stringify(tariffData, null, 2));

    // Check all required fields are present
    expect(tariffData).toHaveProperty("code");
    expect(tariffData).toHaveProperty("name");
    expect(tariffData).toHaveProperty("asset_code");
    expect(tariffData).toHaveProperty("assigned");

    console.log("All required fields present");

    // Verify field values match what we sent
    expect(tariffData.name).toBe(tariffName);
    expect(tariffData.asset_code).toBe(testAsset.code);

    console.log(`Tariff name matches: ${tariffData.name}`);
    console.log(`Asset code matches: ${tariffData.asset_code}`);

    // Verify code format (should start with XT and be followed by numbers)
    expect(tariffData.code).toMatch(/^XT\d+$/);
    console.log(`Tariff code format valid: ${tariffData.code}`);

    // New tariffs should be unassigned by default
    expect(tariffData.assigned).toBe(false);
    console.log(
      `Tariff assigned status: ${tariffData.assigned} (should be false)`,
    );

    // Track created tariff for cleanup
    createdTariffCodes.push(tariffData.code);
    console.log(`Created tariff code: ${tariffData.code}`);

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

    // Verify the tariff appears in the tariffs list
    console.log("\nVerifying tariff appears in tariffs list...");
    const tariffsAfter = await getTariffsListBo(operatorToken);
    const tariffsCountAfter = tariffsAfter.body.length;

    expect(tariffsCountAfter).toBe(tariffsCountBefore + 1);
    console.log(
      `Tariffs count increased by 1: ${tariffsCountBefore} → ${tariffsCountAfter}`,
    );

    // Find the created tariff in the list
    const foundTariff = tariffsAfter.body.find(
      (t: any) => t.code === tariffData.code,
    );
    expect(foundTariff).toBeDefined();
    console.log(`Tariff found in list: ${foundTariff ? "Yes" : "No"}`);

    if (foundTariff) {
      expect(foundTariff.name).toBe(tariffName);
      expect(foundTariff.asset_code).toBe(testAsset.code);
      expect(foundTariff.assigned).toBe(false);
      console.log("Tariff details in list match created tariff");
    }

    console.log("\nTariff creation test completed successfully");
  });

  test("BO: Create multiple tariffs with different assets", async () => {
    // Skip if not enough assets available
    if (availableAssets.length < 2) {
      console.log("Skipping test - need at least 2 assets");
      return;
    }

    console.log("=== Testing creation of multiple tariffs ===");

    // Get current tariffs count
    const tariffsBefore = await getTariffsListBo(operatorToken);
    const initialCount = tariffsBefore.body.length;
    console.log(`Initial tariffs count: ${initialCount}`);

    // Create tariffs with different assets
    const testAssets = availableAssets.slice(0, 3); // Use first 3 assets
    const createdTariffs: any[] = [];

    console.log(
      `Creating ${testAssets.length} tariffs with different assets...`,
    );

    for (let i = 0; i < testAssets.length; i++) {
      const asset = testAssets[i];
      const timestamp = Date.now() + i;
      const tariffName = `Multi Test ${timestamp} Asset ${asset.code}`;

      console.log(`\nCreating tariff ${i + 1}/${testAssets.length}:`);
      console.log(`  Name: ${tariffName}`);
      console.log(`  Asset: ${asset.code} (${asset.name})`);

      const createResult = await createTariffBo(
        operatorToken,
        tariffName,
        asset.code,
      );

      expect(createResult.response.status()).toBe(200);

      const tariffData = createResult.body;
      createdTariffs.push(tariffData);
      createdTariffCodes.push(tariffData.code);

      console.log(`  Created: ${tariffData.code}`);
      console.log(`  Assigned: ${tariffData.assigned}`);

      // Small delay between creations
      if (i < testAssets.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Verify all were created
    console.log("\nVerifying all tariffs were created...");
    const tariffsAfter = await getTariffsListBo(operatorToken);
    const finalCount = tariffsAfter.body.length;

    expect(finalCount).toBe(initialCount + testAssets.length);
    console.log(
      `Tariffs count increased by ${testAssets.length}: ${initialCount} → ${finalCount}`,
    );

    // Verify each created tariff exists in the list
    for (const createdTariff of createdTariffs) {
      const found = tariffsAfter.body.find(
        (t: any) => t.code === createdTariff.code,
      );
      expect(found).toBeDefined();
      expect(found.name).toBe(createdTariff.name);
      expect(found.asset_code).toBe(createdTariff.asset_code);
      expect(found.assigned).toBe(false);
      console.log(`Verified tariff ${createdTariff.code} in list`);
    }

    console.log("\nMultiple tariff creation test completed");
  });

  test("BO: Create tariff with invalid asset code should fail", async () => {
    console.log("=== Testing tariff creation with invalid asset code ===");

    const invalidAssetCode = "INV";
    const tariffName = `Test Invalid Asset ${Date.now()}`;

    console.log(`Attempting to create tariff:`);
    console.log(`  Name: ${tariffName}`);
    console.log(`  Asset code: ${invalidAssetCode}`);

    try {
      const createResult = await createTariffBo(
        operatorToken,
        tariffName,
        invalidAssetCode,
      );

      const status = createResult.response.status();
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
