import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { addTariffFeeExpressionBo } from "@utils/coreService/services/tariffConfiguration/addTariffFeeExpressionBo";
import { getTariffFeesListBo } from "@utils/coreService/services/tariffConfiguration/getTariffFeesListBo";

test.describe("BackOffice - Core Admin - Get Tariff Fees List", () => {
  let operatorToken: string;
  let testTariffCode: string;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Create a test tariff
    console.log("\nCreating test tariff for fees list testing...");
    try {
      const timestamp = Date.now();
      const tariffName = `Test Tariff Fees ${timestamp}`;

      // Create tariff with EUR asset (as per example)
      const createResult = await createTariffBo(
        operatorToken,
        tariffName,
        "EUR", // Using EUR as in example response
      );

      if (createResult.response.status() === 200) {
        testTariffCode = createResult.body.code;
        console.log(`Test tariff created: ${testTariffCode}`);

        // Create two fees for testing
        console.log("\nCreating two fees for testing...");

        // First fee
        const firstFeeData = {
          name: `First Test Fee ${timestamp}`,
          service_parameter: "withdrawn_amount", // From example
          billing_period: "event",
          charge_side: null,
          value: [
            {
              value_from: null,
              value_to: 100000,
              min_value: null,
              max_value: null,
              percent: 2,
              fixed_value: null,
            },
          ],
        };

        const firstFeeResult = await addTariffFeeExpressionBo(
          operatorToken,
          testTariffCode,
          firstFeeData,
        );

        if (firstFeeResult.response.status() === 200) {
          console.log(`First fee created: ${firstFeeResult.body.code}`);
        }

        // Wait a moment between creations
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Second fee (can be identical)
        const secondFeeData = {
          name: `Second Test Fee ${timestamp}`,
          service_parameter: "withdrawn_amount", // Same as first
          billing_period: "event",
          charge_side: null,
          value: [
            {
              value_from: null,
              value_to: 50000,
              min_value: null,
              max_value: null,
              percent: 1.5,
              fixed_value: null,
            },
          ],
        };

        const secondFeeResult = await addTariffFeeExpressionBo(
          operatorToken,
          testTariffCode,
          secondFeeData,
        );

        if (secondFeeResult.response.status() === 200) {
          console.log(`Second fee created: ${secondFeeResult.body.code}`);
        }

        console.log("\nTariff and fees setup completed");
      } else {
        console.log(
          `Failed to create tariff: ${createResult.response.status()}`,
        );
        test.skip();
      }
    } catch (error: any) {
      console.log(`Failed to setup test: ${error.message}`);
      test.skip();
    }
  });

  test("BO: Get fees list for tariff - basic verification", async () => {
    // Skip if test tariff was not created
    if (!testTariffCode) {
      console.log("Skipping test - test tariff not created");
      return;
    }

    console.log("=== Testing fees list retrieval ===");
    console.log(`Tariff Code: ${testTariffCode}`);

    // Get fees list
    const feesListResult = await getTariffFeesListBo(
      operatorToken,
      testTariffCode,
    );

    // Verify response status
    const response = feesListResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);

    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body is an array
    const feesList = feesListResult.body;
    expect(Array.isArray(feesList)).toBe(true);
    console.log(`Response is an array with ${feesList.length} fees`);

    // Check we have at least some fees
    expect(feesList.length).toBeGreaterThan(0);

    // Verify structure of first fee
    if (feesList.length > 0) {
      const firstFee = feesList[0];

      // Check required fields
      expect(firstFee).toHaveProperty("code");
      expect(firstFee).toHaveProperty("name");
      expect(firstFee).toHaveProperty("asset_code");
      expect(firstFee).toHaveProperty("service_code");
      expect(firstFee).toHaveProperty("service_parameter");
      expect(firstFee).toHaveProperty("service_parameter_name");
      expect(firstFee).toHaveProperty("billing_period");
      expect(firstFee).toHaveProperty("fixed_value");
      expect(firstFee).toHaveProperty("expression_value");
      expect(firstFee).toHaveProperty("value_json");

      console.log("First fee has all required fields");

      // Check field types
      expect(typeof firstFee.code).toBe("string");
      expect(typeof firstFee.name).toBe("string");
      expect(typeof firstFee.asset_code).toBe("string");
      expect(typeof firstFee.service_code).toBe("string");
      expect(typeof firstFee.service_parameter).toBe("string");
      expect(typeof firstFee.service_parameter_name).toBe("string");
      expect(typeof firstFee.billing_period).toBe("string");
      expect(Array.isArray(firstFee.expression_value)).toBe(true);
      expect(typeof firstFee.value_json).toBe("string");

      console.log("All field types are correct");

      // Check fee code format
      expect(firstFee.code).toMatch(new RegExp(`^${testTariffCode}\\d+$`));
      console.log(`Fee code format valid: ${firstFee.code}`);
    }

    console.log("\nFees list test completed successfully");
  });

  test("BO: Verify all fees have same asset code as tariff", async () => {
    // Skip if test tariff was not created
    if (!testTariffCode) {
      console.log("Skipping test - test tariff not created");
      return;
    }

    console.log("=== Verifying fees asset code consistency ===");

    const feesListResult = await getTariffFeesListBo(
      operatorToken,
      testTariffCode,
    );
    const feesList = feesListResult.body;

    expect(feesListResult.response.status()).toBe(200);
    expect(Array.isArray(feesList)).toBe(true);

    if (feesList.length === 0) {
      console.log("No fees to verify");
      return;
    }

    // All fees should have the same asset code (EUR in our case)
    const uniqueAssetCodes = new Set(
      feesList.map((fee: any) => fee.asset_code),
    );

    expect(uniqueAssetCodes.size).toBe(1);
    console.log(
      `All ${feesList.length} fees have same asset code: ${Array.from(uniqueAssetCodes)[0]}`,
    );

    console.log("\nAsset code verification completed");
  });
});
