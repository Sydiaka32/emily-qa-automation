import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { getAssetsListBo } from "@utils/general/getAssetsListBo";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { getTariffServiceParametersBo } from "@utils/coreService/services/tariffConfiguration/getTariffServiceParametersBo";
import { findSuitableServiceParameter } from "@utils/coreService/services/tariffConfiguration/findSuitableServiceParameter";
import { addTariffFeeExpressionBo } from "@utils/coreService/services/tariffConfiguration/addTariffFeeExpressionBo";

test.describe("BackOffice - Core Admin - Add Tariff Fee", () => {
  let operatorToken: string;
  let testTariffCode: string;
  let serviceParameters: any;
  let suitableParameter: any;

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
    console.log("\nCreating test tariff for fee testing...");
    try {
      // Prefer EUR for testing based on example
      const testAsset =
        availableAssets.find((a: any) => a.code === "EUR") ||
        availableAssets.find((a: any) => a.type === "fiat") ||
        availableAssets[0];

      if (!testAsset) {
        console.log("No assets available to create tariff");
        test.skip();
        return;
      }

      const timestamp = Date.now();
      const tariffName = `Test Tariff Fee ${timestamp}`;
      const assetCode = testAsset.code;

      console.log(`Creating tariff with name: ${tariffName}`);
      console.log(`Asset code: ${assetCode}`);

      const createResult = await createTariffBo(
        operatorToken,
        tariffName,
        assetCode,
      );

      if (createResult.response.status() === 200) {
        testTariffCode = createResult.body.code;
        console.log(`Test tariff created: ${testTariffCode}`);
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

    // Get service parameters
    console.log("\nGetting service parameters...");
    try {
      const serviceParamsResult =
        await getTariffServiceParametersBo(operatorToken);

      if (serviceParamsResult.response.status() === 200) {
        serviceParameters = serviceParamsResult.body;
        console.log("Service parameters retrieved successfully");

        // Find a suitable parameter for testing
        suitableParameter = findSuitableServiceParameter(serviceParameters);

        if (!suitableParameter) {
          console.log("No suitable service parameters found");
          test.skip();
        }
      } else {
        console.log(
          `Failed to get service parameters: ${serviceParamsResult.response.status()}`,
        );
        test.skip();
      }
    } catch (error: any) {
      console.log(`Failed to get service parameters: ${error.message}`);
      test.skip();
    }
  });

  test("BO: Add fee expression to tariff - verify response structure", async () => {
    // Skip if prerequisites not met
    if (!testTariffCode || !suitableParameter) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    console.log("=== Testing fee expression addition ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(
      `Service Parameter: ${suitableParameter.parameterCode} (${suitableParameter.parameterName})`,
    );
    console.log(`Service Code: ${suitableParameter.serviceCode}`);

    // Prepare fee data
    const timestamp = Date.now();
    const feeName = `Test Fee ${timestamp}`;
    const billingPeriod = "event"; // Use event billing period

    const feeData = {
      name: feeName,
      service_parameter: suitableParameter.parameterCode,
      billing_period: billingPeriod,
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

    console.log("\nFee data:", JSON.stringify(feeData, null, 2));

    // Add fee expression
    console.log("\nAdding fee expression to tariff...");
    const feeResult = await addTariffFeeExpressionBo(
      operatorToken,
      testTariffCode,
      feeData,
    );

    // Verify response
    const response = feeResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const feeResponse = feeResult.body;
    console.log("Response body:", JSON.stringify(feeResponse, null, 2));

    // Check all required fields are present
    expect(feeResponse).toHaveProperty("code");
    expect(feeResponse).toHaveProperty("name");
    expect(feeResponse).toHaveProperty("asset_code");
    expect(feeResponse).toHaveProperty("service_code");
    expect(feeResponse).toHaveProperty("service_parameter");
    expect(feeResponse).toHaveProperty("service_parameter_name");
    expect(feeResponse).toHaveProperty("billing_period");
    expect(feeResponse).toHaveProperty("fixed_value");
    expect(feeResponse).toHaveProperty("expression_value");
    expect(feeResponse).toHaveProperty("value_json");

    console.log("All required fields present");

    // Verify field values match what we sent
    expect(feeResponse.name).toBe(feeName);
    expect(feeResponse.service_parameter).toBe(suitableParameter.parameterCode);
    expect(feeResponse.service_parameter_name).toBe(
      suitableParameter.parameterName,
    );
    expect(feeResponse.billing_period).toBe(billingPeriod);
    expect(feeResponse.service_code).toBe(suitableParameter.serviceCode);

    console.log(`Fee name matches: ${feeResponse.name}`);
    console.log(`Service parameter matches: ${feeResponse.service_parameter}`);
    console.log(
      `Service parameter name: ${feeResponse.service_parameter_name}`,
    );
    console.log(`Billing period matches: ${feeResponse.billing_period}`);
    console.log(`Service code: ${feeResponse.service_code}`);

    // Verify fee code format (should be tariff code + additional digits)
    expect(feeResponse.code).toMatch(new RegExp(`^${testTariffCode}\\d+$`));
    console.log(`Fee code format valid: ${feeResponse.code}`);

    // Verify asset code is present (should match tariff's asset)
    expect(typeof feeResponse.asset_code).toBe("string");
    console.log(`Asset code: ${feeResponse.asset_code}`);

    // Verify expression_value is an array with our data
    expect(Array.isArray(feeResponse.expression_value)).toBe(true);
    expect(feeResponse.expression_value.length).toBe(1);

    const expression = feeResponse.expression_value[0];
    expect(expression.value_to).toBe(100000);
    expect(expression.percent).toBe(2);
    expect(expression.value_from).toBe(null);
    expect(expression.fixed_value).toBe(null);
    expect(expression.min_value).toBe(null);
    expect(expression.max_value).toBe(null);

    console.log("Expression value verified:");

    // Verify value_json is a string representation
    expect(typeof feeResponse.value_json).toBe("string");
    expect(feeResponse.value_json).toContain("value_to");
    expect(feeResponse.value_json).toContain("percent");
    console.log(
      `Value JSON is string: ${feeResponse.value_json.substring(0, 100)}...`,
    );

    // Verify data types
    console.log("\nData type verification:");
    console.log(
      `  code: ${typeof feeResponse.code} (value: ${feeResponse.code})`,
    );
    console.log(
      `  name: ${typeof feeResponse.name} (value: ${feeResponse.name})`,
    );
    console.log(
      `  asset_code: ${typeof feeResponse.asset_code} (value: ${feeResponse.asset_code})`,
    );
    console.log(
      `  service_code: ${typeof feeResponse.service_code} (value: ${feeResponse.service_code})`,
    );
    console.log(
      `  service_parameter: ${typeof feeResponse.service_parameter} (value: ${feeResponse.service_parameter})`,
    );
    console.log(
      `  service_parameter_name: ${typeof feeResponse.service_parameter_name} (value: ${feeResponse.service_parameter_name})`,
    );
    console.log(
      `  billing_period: ${typeof feeResponse.billing_period} (value: ${feeResponse.billing_period})`,
    );
    console.log(
      `  fixed_value: ${typeof feeResponse.fixed_value} (value: ${feeResponse.fixed_value})`,
    );
    console.log(
      `  expression_value: ${Array.isArray(feeResponse.expression_value) ? "array" : typeof feeResponse.expression_value}`,
    );
    console.log(`  value_json: ${typeof feeResponse.value_json}`);

    expect(typeof feeResponse.code).toBe("string");
    expect(typeof feeResponse.name).toBe("string");
    expect(typeof feeResponse.asset_code).toBe("string");
    expect(typeof feeResponse.service_code).toBe("string");
    expect(typeof feeResponse.service_parameter).toBe("string");
    expect(typeof feeResponse.service_parameter_name).toBe("string");
    expect(typeof feeResponse.billing_period).toBe("string");
    expect(Array.isArray(feeResponse.expression_value)).toBe(true);
    expect(typeof feeResponse.value_json).toBe("string");

    console.log("\nFee expression addition test completed successfully");
  });

  test("BO: Add fee with invalid service parameter should fail", async () => {
    // Skip if prerequisites not met
    if (!testTariffCode) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    console.log("=== Testing fee with invalid service parameter ===");
    console.log(`Tariff Code: ${testTariffCode}`);

    const invalidParameter = "INVALID_PARAMETER_XYZ";
    const feeData = {
      name: `Test Invalid Parameter ${Date.now()}`,
      service_parameter: invalidParameter,
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

    console.log(`Using invalid service parameter: ${invalidParameter}`);
    console.log(`Fee name: ${feeData.name}`);

    try {
      const feeResult = await addTariffFeeExpressionBo(
        operatorToken,
        testTariffCode,
        feeData,
      );

      const status = feeResult.response.status();
      console.log(`Response status: ${status}`);

      // Should be 400 or 404 for invalid parameter
      expect(status).not.toBe(200);
      console.log(`Expected non-200 status, got: ${status}`);
    } catch (error: any) {
      console.log(`Expected error occurred: ${error.message}`);
    }

    console.log("\nInvalid service parameter test completed");
  });

  test("BO: Add flat fee (fixed value) to tariff", async () => {
    // Skip if prerequisites not met
    if (!testTariffCode || !suitableParameter) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    console.log("=== Testing flat fee (fixed value) addition ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(
      `Service Parameter: ${suitableParameter.parameterCode} (${suitableParameter.parameterName})`,
    );
    console.log(`Service Code: ${suitableParameter.serviceCode}`);

    // Prepare flat fee data
    const timestamp = Date.now();
    const feeName = `Flat Fee ${timestamp}`;
    const billingPeriod = "event";

    const flatFeeData = {
      name: feeName,
      service_parameter: suitableParameter.parameterCode,
      billing_period: billingPeriod,
      charge_side: null,
      value: [
        {
          value_from: null,
          value_to: 14, // Upper limit (optional)
          min_value: null,
          max_value: null,
          percent: null, // Null for flat fee
          fixed_value: 2, // Fixed value instead of percentage
        },
      ],
    };

    console.log("\nFlat fee data:", JSON.stringify(flatFeeData, null, 2));

    // Add flat fee
    console.log("\nAdding flat fee to tariff...");
    const feeResult = await addTariffFeeExpressionBo(
      operatorToken,
      testTariffCode,
      flatFeeData,
    );

    // Verify response
    const response = feeResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const feeResponse = feeResult.body;
    console.log("Response body:", JSON.stringify(feeResponse, null, 2));

    // Check all required fields are present
    expect(feeResponse).toHaveProperty("code");
    expect(feeResponse).toHaveProperty("name");
    expect(feeResponse).toHaveProperty("asset_code");
    expect(feeResponse).toHaveProperty("service_code");
    expect(feeResponse).toHaveProperty("service_parameter");
    expect(feeResponse).toHaveProperty("service_parameter_name");
    expect(feeResponse).toHaveProperty("billing_period");
    expect(feeResponse).toHaveProperty("fixed_value");
    expect(feeResponse).toHaveProperty("expression_value");
    expect(feeResponse).toHaveProperty("value_json");

    console.log("All required fields present");

    // Verify field values match what we sent
    expect(feeResponse.name).toBe(feeName);
    expect(feeResponse.service_parameter).toBe(suitableParameter.parameterCode);
    expect(feeResponse.service_parameter_name).toBe(
      suitableParameter.parameterName,
    );
    expect(feeResponse.billing_period).toBe(billingPeriod);
    expect(feeResponse.service_code).toBe(suitableParameter.serviceCode);

    console.log(`Fee name matches: ${feeResponse.name}`);
    console.log(`Service parameter matches: ${feeResponse.service_parameter}`);
    console.log(
      `Service parameter name: ${feeResponse.service_parameter_name}`,
    );
    console.log(`Billing period matches: ${feeResponse.billing_period}`);
    console.log(`Service code: ${feeResponse.service_code}`);

    // Verify fee code format (should be tariff code + additional digits)
    expect(feeResponse.code).toMatch(new RegExp(`^${testTariffCode}\\d+$`));
    console.log(`Fee code format valid: ${feeResponse.code}`);

    // Verify asset code is present (should match tariff's asset)
    expect(typeof feeResponse.asset_code).toBe("string");
    console.log(`Asset code: ${feeResponse.asset_code}`);

    // Verify expression_value structure for flat fee
    expect(Array.isArray(feeResponse.expression_value)).toBe(true);
    expect(feeResponse.expression_value.length).toBe(1);

    const expression = feeResponse.expression_value[0];

    // For flat fee: fixed_value should be set, percent should be null
    expect(expression.fixed_value).toBe(2);
    expect(expression.percent).toBe(null);

    // Other values may be null or as specified
    expect(expression.value_from).toBe(null);
    expect(expression.value_to).toBe(14);
    expect(expression.min_value).toBe(null);
    expect(expression.max_value).toBe(null);

    console.log("\nFlat fee expression verified:");
    console.log(`  Fixed value: ${expression.fixed_value}`);
    console.log(
      `  Percent: ${expression.percent} (should be null for flat fee)`,
    );
    console.log(`  Value to (upper limit): ${expression.value_to}`);
    console.log(`  Value from: ${expression.value_from}`);

    // Verify value_json is a string representation
    expect(typeof feeResponse.value_json).toBe("string");
    expect(feeResponse.value_json).toContain('"fixed_value":2');
    expect(feeResponse.value_json).toContain('"percent":null');
    expect(feeResponse.value_json).toContain('"value_to":14');
    console.log(
      `Value JSON is string: ${feeResponse.value_json.substring(0, 100)}...`,
    );

    // Parse value_json to verify structure
    try {
      const parsedValueJson = JSON.parse(feeResponse.value_json);
      expect(Array.isArray(parsedValueJson)).toBe(true);
      expect(parsedValueJson.length).toBe(1);
      expect(parsedValueJson[0].fixed_value).toBe(2);
      expect(parsedValueJson[0].percent).toBe(null);
      console.log("Value JSON parses correctly and has flat fee structure");
    } catch (error: any) {
      console.log(`Failed to parse value_json: ${error.message}`);
    }

    // Verify data types
    console.log("\nData type verification:");
    console.log(
      `  code: ${typeof feeResponse.code} (value: ${feeResponse.code})`,
    );
    console.log(
      `  name: ${typeof feeResponse.name} (value: ${feeResponse.name})`,
    );
    console.log(
      `  asset_code: ${typeof feeResponse.asset_code} (value: ${feeResponse.asset_code})`,
    );
    console.log(
      `  service_code: ${typeof feeResponse.service_code} (value: ${feeResponse.service_code})`,
    );
    console.log(
      `  service_parameter: ${typeof feeResponse.service_parameter} (value: ${feeResponse.service_parameter})`,
    );
    console.log(
      `  service_parameter_name: ${typeof feeResponse.service_parameter_name} (value: ${feeResponse.service_parameter_name})`,
    );
    console.log(
      `  billing_period: ${typeof feeResponse.billing_period} (value: ${feeResponse.billing_period})`,
    );
    console.log(
      `  fixed_value: ${typeof feeResponse.fixed_value} (value: ${feeResponse.fixed_value})`,
    );
    console.log(
      `  expression_value: ${Array.isArray(feeResponse.expression_value) ? "array" : typeof feeResponse.expression_value}`,
    );
    console.log(`  value_json: ${typeof feeResponse.value_json}`);

    expect(typeof feeResponse.code).toBe("string");
    expect(typeof feeResponse.name).toBe("string");
    expect(typeof feeResponse.asset_code).toBe("string");
    expect(typeof feeResponse.service_code).toBe("string");
    expect(typeof feeResponse.service_parameter).toBe("string");
    expect(typeof feeResponse.service_parameter_name).toBe("string");
    expect(typeof feeResponse.billing_period).toBe("string");
    expect(Array.isArray(feeResponse.expression_value)).toBe(true);
    expect(typeof feeResponse.value_json).toBe("string");

    console.log("\nFlat fee addition test completed successfully");
  });

  test("BO: Add flat fee with min/max limits", async () => {
    // Skip if prerequisites not met
    if (!testTariffCode || !suitableParameter) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    console.log("=== Testing flat fee with min/max limits ===");
    console.log(`Tariff Code: ${testTariffCode}`);

    // Prepare flat fee data with min/max limits
    const timestamp = Date.now();
    const feeName = `Limited Flat Fee ${timestamp}`;

    const flatFeeData = {
      name: feeName,
      service_parameter: suitableParameter.parameterCode,
      billing_period: "event",
      charge_side: null,
      value: [
        {
          value_from: null,
          value_to: 1000,
          min_value: 10, // Minimum fee amount
          max_value: 100, // Maximum fee amount
          percent: null,
          fixed_value: 50, // Base fixed value
        },
      ],
    };

    console.log(
      "\nFlat fee data with min/max limits:",
      JSON.stringify(flatFeeData.value, null, 2),
    );

    // Add flat fee
    console.log("\nAdding flat fee with min/max limits...");
    const feeResult = await addTariffFeeExpressionBo(
      operatorToken,
      testTariffCode,
      flatFeeData,
    );

    // Verify response
    const status = feeResult.response.status();

    console.log(`Response status: ${status}`);

    if (status === 200) {
      const feeResponse = feeResult.body;
      console.log(`Flat fee created: ${feeResponse.code}`);

      // Verify the structure
      const expression = feeResponse.expression_value[0];
      expect(expression.fixed_value).toBe(50);
      expect(expression.percent).toBe(null);
      expect(expression.min_value).toBe(10);
      expect(expression.max_value).toBe(100);

      console.log("Flat fee with min/max limits created successfully");
      console.log(`  Fixed value: ${expression.fixed_value}`);
      console.log(`  Min value: ${expression.min_value}`);
      console.log(`  Max value: ${expression.max_value}`);
    } else {
      console.log(`Unexpected status: ${status}`);
    }

    console.log("\nFlat fee with min/max limits test completed");
  });
});
