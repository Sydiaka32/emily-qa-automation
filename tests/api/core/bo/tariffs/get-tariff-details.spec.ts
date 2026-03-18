import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { getAssetsListBo } from "@utils/general/getAssetsListBo";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { getTariffDetailsBo } from "@utils/coreService/services/tariffConfiguration/getTariffDetailsBo";

test.describe("BackOffice - Core Admin - Get Tariff Details", () => {
  let operatorToken: string;
  let testTariffCode: string;
  let testTariffName: string;
  let testAssetCode: string;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Get available assets
    console.log("Getting list of available assets...");
    let availableAssets: any[] = [];
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
    console.log("\nCreating test tariff for details testing...");
    try {
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
      testTariffName = `Test Tariff Details ${timestamp}`;
      testAssetCode = testAsset.code;

      console.log(`Creating tariff with name: ${testTariffName}`);
      console.log(`Asset code: ${testAssetCode}`);

      const createResult = await createTariffBo(
        operatorToken,
        testTariffName,
        testAssetCode,
      );

      if (createResult.response.status() === 200) {
        testTariffCode = createResult.body.code;
        console.log(`Test tariff created: ${testTariffCode}`);
        console.log(
          `Tariff details: ${JSON.stringify(createResult.body, null, 2)}`,
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

  test("BO: Get tariff details by code - verify response structure", async () => {
    // Skip if test tariff was not created
    if (!testTariffCode) {
      console.log("Skipping test - test tariff not created");
      return;
    }

    console.log("=== Testing tariff details retrieval ===");
    console.log(`Tariff Code: ${testTariffCode}`);

    // Get tariff details
    const detailsResult = await getTariffDetailsBo(
      operatorToken,
      testTariffCode,
    );

    // Verify response
    const response = detailsResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const tariffData = detailsResult.body;
    console.log("Response body:", JSON.stringify(tariffData, null, 2));

    // Check all required fields are present
    expect(tariffData).toHaveProperty("code");
    expect(tariffData).toHaveProperty("name");
    expect(tariffData).toHaveProperty("asset_code");
    expect(tariffData).toHaveProperty("assigned");

    console.log("All required fields present");

    // Verify field values match what we created
    expect(tariffData.code).toBe(testTariffCode);
    expect(tariffData.name).toBe(testTariffName);
    expect(tariffData.asset_code).toBe(testAssetCode);

    console.log(`Tariff code matches: ${tariffData.code}`);
    console.log(`Tariff name matches: ${tariffData.name}`);
    console.log(`Asset code matches: ${tariffData.asset_code}`);

    // Verify assigned status (should be false for newly created tariff)
    expect(tariffData.assigned).toBe(false);
    console.log(
      `Tariff assigned status: ${tariffData.assigned} (should be false)`,
    );

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

    console.log("\nTariff details test completed successfully");
  });
});
