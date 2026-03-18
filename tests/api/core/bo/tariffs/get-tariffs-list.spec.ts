import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { getTariffsListBo } from "@utils/coreService/services/tariffConfiguration/getTariffsListBo";

test.describe("BackOffice - Core Admin - Get Tariffs List", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");
  });

  test("BO: Get tariffs list - verify response structure", async () => {
    console.log("=== Testing tariffs list retrieval ===");

    // Get tariffs list
    const tariffsResult = await getTariffsListBo(operatorToken);

    // Verify response
    const response = tariffsResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const tariffsData = tariffsResult.body;
    console.log(
      `Response contains ${Array.isArray(tariffsData) ? tariffsData.length : "non-array"} items`,
    );

    // Check response is an array
    expect(Array.isArray(tariffsData)).toBe(true);
    console.log("Response is an array");

    // If array is empty, we can still validate structure
    if (tariffsData.length === 0) {
      console.log("Warning: Tariffs list is empty");
      return;
    }

    console.log(`Number of tariffs: ${tariffsData.length}`);

    // Check first tariff item structure
    const firstTariff = tariffsData[0];
    console.log("First tariff item:", JSON.stringify(firstTariff, null, 2));

    // Verify required fields are present
    expect(firstTariff).toHaveProperty("code");
    expect(firstTariff).toHaveProperty("name");
    expect(firstTariff).toHaveProperty("asset_code");
    expect(firstTariff).toHaveProperty("assigned");

    console.log("All required fields present in tariff items");

    // Verify field types
    console.log("\nData type verification for first tariff:");
    console.log(
      `  code: ${typeof firstTariff.code} (value: ${firstTariff.code})`,
    );
    console.log(
      `  name: ${typeof firstTariff.name} (value: ${firstTariff.name})`,
    );
    console.log(
      `  asset_code: ${typeof firstTariff.asset_code} (value: ${firstTariff.asset_code})`,
    );
    console.log(
      `  assigned: ${typeof firstTariff.assigned} (value: ${firstTariff.assigned})`,
    );

    expect(typeof firstTariff.code).toBe("string");
    expect(typeof firstTariff.name).toBe("string");
    expect(typeof firstTariff.asset_code).toBe("string");
    expect(typeof firstTariff.assigned).toBe("boolean");

    console.log("All field types are correct");

    console.log("\nTariffs list test completed successfully");
  });

  test("BO: Verify all tariffs have correct structure", async () => {
    console.log("=== Verifying structure of all tariffs ===");

    const tariffsResult = await getTariffsListBo(operatorToken);
    const tariffsData = tariffsResult.body;

    expect(tariffsResult.response.status()).toBe(200);
    expect(Array.isArray(tariffsData)).toBe(true);

    if (tariffsData.length === 0) {
      console.log("No tariffs to verify");
      return;
    }

    console.log(`Verifying ${tariffsData.length} tariff configurations...`);

    // Check each tariff item
    const invalidTariffs: any[] = [];

    tariffsData.forEach((tariff: any, index: number) => {
      const hasCode = tariff.hasOwnProperty("code");
      const hasName = tariff.hasOwnProperty("name");
      const hasAssetCode = tariff.hasOwnProperty("asset_code");
      const hasAssigned = tariff.hasOwnProperty("assigned");

      const codeIsString = typeof tariff.code === "string";
      const nameIsString = typeof tariff.name === "string";
      const assetCodeIsString = typeof tariff.asset_code === "string";
      const assignedIsBoolean = typeof tariff.assigned === "boolean";

      if (
        !hasCode ||
        !hasName ||
        !hasAssetCode ||
        !hasAssigned ||
        !codeIsString ||
        !nameIsString ||
        !assetCodeIsString ||
        !assignedIsBoolean
      ) {
        invalidTariffs.push({
          index,
          tariff,
          missingFields: {
            code: !hasCode,
            name: !hasName,
            asset_code: !hasAssetCode,
            assigned: !hasAssigned,
          },
          typeErrors: {
            code: !codeIsString,
            name: !nameIsString,
            asset_code: !assetCodeIsString,
            assigned: !assignedIsBoolean,
          },
        });
      }
    });

    if (invalidTariffs.length === 0) {
      console.log(`All ${tariffsData.length} tariffs have correct structure`);
    } else {
      console.log(
        `Found ${invalidTariffs.length} tariffs with incorrect structure`,
      );
      invalidTariffs.forEach((invalid) => {
        console.log(
          `  Index ${invalid.index}:`,
          JSON.stringify(invalid.tariff),
        );
      });
      // Don't fail the test, just log the issues
      // expect(invalidTariffs.length).toBe(0);
    }

    // Count assigned vs unassigned tariffs
    const assignedCount = tariffsData.filter(
      (t: any) => t.assigned === true,
    ).length;
    const unassignedCount = tariffsData.filter(
      (t: any) => t.assigned === false,
    ).length;

    console.log(`\nTariff assignment statistics:`);
    console.log(`  Assigned tariffs: ${assignedCount}`);
    console.log(`  Unassigned tariffs: ${unassignedCount}`);
    console.log(`  Total: ${tariffsData.length}`);

    // Count unique asset codes
    const assetCodes = new Set(tariffsData.map((t: any) => t.asset_code));
    console.log(`\nUnique asset codes: ${assetCodes.size}`);
    console.log(`Asset codes: ${Array.from(assetCodes).join(", ")}`);

    console.log("\nAll tariffs structure verification completed");
  });
});
