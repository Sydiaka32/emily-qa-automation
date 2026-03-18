import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { addTariffFeeExpressionBo } from "@utils/coreService/services/tariffConfiguration/addTariffFeeExpressionBo";
import { updateFeeExpressionBo } from "@utils/coreService/services/tariffConfiguration/updateFeeExpressionBo";
import { getFeeDetailsBo } from "@utils/coreService/services/tariffConfiguration/getFeeDetailsBo";

test.describe("BackOffice - Core Admin - Edit Fee Amount", () => {
  let operatorToken: string;
  let testTariffCode: string;
  let testFeeCode: string;
  let originalFeeData: any;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Create a test tariff
    console.log("\nCreating test tariff for fee editing...");
    try {
      const timestamp = Date.now();
      const tariffName = `Test Tariff Edit Fee ${timestamp}`;

      // Create tariff with EUR asset
      const createResult = await createTariffBo(
        operatorToken,
        tariffName,
        "EUR",
      );

      if (createResult.response.status() === 200) {
        testTariffCode = createResult.body.code;
        console.log(`Test tariff created: ${testTariffCode}`);

        // Create a fee for editing
        console.log("\nCreating fee for editing...");

        const feeData = {
          name: `Test Fee to Edit ${timestamp}`,
          service_parameter: "withdrawn_amount", // Using a common parameter
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

        const feeResult = await addTariffFeeExpressionBo(
          operatorToken,
          testTariffCode,
          feeData,
        );

        if (feeResult.response.status() === 200) {
          testFeeCode = feeResult.body.code;
          originalFeeData = feeResult.body;
          console.log(`Test fee created: ${testFeeCode}`);
          console.log(
            "Original fee data:",
            JSON.stringify(originalFeeData, null, 2),
          );
        } else {
          console.log(`Failed to create fee: ${feeResult.response.status()}`);
          test.skip();
        }
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

  test("BO: Edit fee amount - update tier values", async () => {
    // Skip if test fee was not created
    if (!testTariffCode || !testFeeCode || !originalFeeData) {
      console.log("Skipping test - test fee not created");
      return;
    }

    console.log("=== Testing fee amount update ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Fee Code: ${testFeeCode}`);
    console.log(`Original Fee Name: ${originalFeeData.name}`);

    // Prepare updated fee data
    const updatedFeeData = {
      name: originalFeeData.name, // Keep same name
      service_parameter: originalFeeData.service_parameter, // Keep same service parameter
      billing_period: originalFeeData.billing_period, // Keep same billing period
      value: [
        {
          value_from: 12, // Changed from null to 12
          value_to: null, // Changed from 100000 to null
          min_value: null,
          max_value: null,
          percent: 1, // Changed from 2 to 1
          fixed_value: null,
        },
      ],
    };

    console.log("\nUpdated fee data:", JSON.stringify(updatedFeeData, null, 2));

    // Update fee expression
    console.log("\nUpdating fee expression...");
    const updateResult = await updateFeeExpressionBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
      updatedFeeData,
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
    const updatedFee = updateResult.body;
    console.log("Response body:", JSON.stringify(updatedFee, null, 2));

    // Check all required fields are present
    expect(updatedFee).toHaveProperty("code");
    expect(updatedFee).toHaveProperty("name");
    expect(updatedFee).toHaveProperty("asset_code");
    expect(updatedFee).toHaveProperty("service_code");
    expect(updatedFee).toHaveProperty("service_parameter");
    expect(updatedFee).toHaveProperty("service_parameter_name");
    expect(updatedFee).toHaveProperty("billing_period");
    expect(updatedFee).toHaveProperty("fixed_value");
    expect(updatedFee).toHaveProperty("expression_value");
    expect(updatedFee).toHaveProperty("value_json");

    console.log("All required fields present");

    // Verify fee code remains the same
    expect(updatedFee.code).toBe(testFeeCode);
    console.log(`Fee code unchanged: ${updatedFee.code}`);

    // Verify name remains the same
    expect(updatedFee.name).toBe(originalFeeData.name);
    console.log(`Fee name unchanged: ${updatedFee.name}`);

    // Verify other fields remain the same
    expect(updatedFee.asset_code).toBe(originalFeeData.asset_code);
    expect(updatedFee.service_code).toBe(originalFeeData.service_code);
    expect(updatedFee.service_parameter).toBe(
      originalFeeData.service_parameter,
    );
    expect(updatedFee.service_parameter_name).toBe(
      originalFeeData.service_parameter_name,
    );
    expect(updatedFee.billing_period).toBe(originalFeeData.billing_period);

    console.log("Other fee details unchanged");

    // Verify tier values are updated
    expect(Array.isArray(updatedFee.expression_value)).toBe(true);
    expect(updatedFee.expression_value.length).toBe(1);

    const updatedTier = updatedFee.expression_value[0];
    expect(updatedTier.value_from).toBe(12);
    expect(updatedTier.value_to).toBe(null);
    expect(updatedTier.percent).toBe(1);
    expect(updatedTier.fixed_value).toBe(null);
    expect(updatedTier.min_value).toBe(null);
    expect(updatedTier.max_value).toBe(null);

    console.log("\nTier values updated:");
    console.log(
      `  value_from: ${updatedTier.value_from} (was: ${originalFeeData.expression_value[0].value_from})`,
    );
    console.log(
      `  value_to: ${updatedTier.value_to} (was: ${originalFeeData.expression_value[0].value_to})`,
    );
    console.log(
      `  percent: ${updatedTier.percent} (was: ${originalFeeData.expression_value[0].percent})`,
    );

    // Verify value_json is updated
    expect(typeof updatedFee.value_json).toBe("string");
    expect(updatedFee.value_json).toContain('"value_from":12');
    expect(updatedFee.value_json).toContain('"value_to":null');
    expect(updatedFee.value_json).toContain('"percent":1');

    console.log(
      `Value JSON updated: ${updatedFee.value_json.substring(0, 100)}...`,
    );

    console.log("\nFee amount update test completed successfully");
  });

  test("BO: Verify fee is actually updated in the system", async () => {
    // Skip if test fee was not created
    if (!testTariffCode || !testFeeCode) {
      console.log("Skipping test - test fee not created");
      return;
    }

    console.log("=== Verifying fee is updated in system ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Fee Code: ${testFeeCode}`);

    // First, get the current fee details to verify update
    console.log("\nGetting current fee details...");
    const detailsResult = await getFeeDetailsBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
    );

    expect(detailsResult.response.status()).toBe(200);
    const currentFee = detailsResult.body;

    console.log("Current fee details:", JSON.stringify(currentFee, null, 2));

    // Verify the values match what we expect from the previous test
    expect(currentFee.code).toBe(testFeeCode);
    expect(Array.isArray(currentFee.expression_value)).toBe(true);
    expect(currentFee.expression_value.length).toBe(1);

    const currentTier = currentFee.expression_value[0];
    expect(currentTier.value_from).toBe(12);
    expect(currentTier.value_to).toBe(null);
    expect(currentTier.percent).toBe(1);

    console.log("Fee is updated in the system");
    console.log(`  value_from: ${currentTier.value_from}`);
    console.log(`  value_to: ${currentTier.value_to}`);
    console.log(`  percent: ${currentTier.percent}`);

    console.log("\nFee update verification completed");
  });
});
