import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { getAssetsListBo } from "@utils/general/getAssetsListBo";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { getTariffServiceParametersBo } from "@utils/coreService/services/tariffConfiguration/getTariffServiceParametersBo";
import { addTariffFeeExpressionBo } from "@utils/coreService/services/tariffConfiguration/addTariffFeeExpressionBo";
import { getFeeDetailsBo } from "@utils/coreService/services/tariffConfiguration/getFeeDetailsBo";

test.describe("BackOffice - Core Admin - Get Fee Details", () => {
  let operatorToken: string;
  let testTariffCode: string;
  let testFeeCode: string;
  let createdFeeData: any;

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
      // Use EUR for testing based on example
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
      const tariffName = `Test Tariff Fee Details ${timestamp}`;
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

    // Get service parameters and create a fee
    console.log("\nCreating test fee...");
    try {
      const serviceParamsResult =
        await getTariffServiceParametersBo(operatorToken);

      if (serviceParamsResult.response.status() === 200) {
        const serviceParameters = serviceParamsResult.body;

        // Find a suitable service parameter (prefer withdrawn_amount from clr service as per example)
        let suitableParameter = null;

        // First try to find withdrawn_amount from clr service
        if (serviceParameters.clr && Array.isArray(serviceParameters.clr)) {
          const withdrawnAmountParam = serviceParameters.clr.find(
            (param: any) => param.code === "withdrawn_amount",
          );

          if (withdrawnAmountParam) {
            suitableParameter = {
              serviceCode: "clr",
              parameterCode: withdrawnAmountParam.code,
              parameterName: withdrawnAmountParam.name,
              periods: withdrawnAmountParam.periods,
            };
            console.log("Using withdrawn_amount parameter from clr service");
          }
        }

        // If not found, look for any parameter with event period
        if (!suitableParameter) {
          const services = Object.keys(serviceParameters);
          for (const serviceCode of services) {
            const serviceParams = serviceParameters[serviceCode];
            if (Array.isArray(serviceParams) && serviceParams.length > 0) {
              const eventParam = serviceParams.find(
                (param: any) =>
                  param.periods && param.periods.includes("event"),
              );
              if (eventParam) {
                suitableParameter = {
                  serviceCode,
                  parameterCode: eventParam.code,
                  parameterName: eventParam.name,
                  periods: eventParam.periods,
                };
                console.log(
                  `Using ${eventParam.code} parameter from ${serviceCode} service`,
                );
                break;
              }
            }
          }
        }

        if (!suitableParameter) {
          console.log("No suitable service parameters found");
          test.skip();
          return;
        }

        // Create fee data
        const timestamp = Date.now();
        const feeName = `Test Fee for Details ${timestamp}`;

        const feeData = {
          name: feeName,
          service_parameter: suitableParameter.parameterCode,
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

        console.log(`Creating fee: ${feeName}`);
        console.log(`Service parameter: ${suitableParameter.parameterCode}`);
        console.log(`Tariff: ${testTariffCode}`);

        const feeResult = await addTariffFeeExpressionBo(
          operatorToken,
          testTariffCode,
          feeData,
        );

        if (feeResult.response.status() === 200) {
          createdFeeData = feeResult.body;
          testFeeCode = createdFeeData.code;
          console.log(`Test fee created: ${testFeeCode}`);
          console.log(
            "Created fee data:",
            JSON.stringify(createdFeeData, null, 2),
          );
        } else {
          console.log(`Failed to create fee: ${feeResult.response.status()}`);
          console.log(
            `Error response: ${JSON.stringify(feeResult.body, null, 2)}`,
          );
          test.skip();
        }
      } else {
        console.log(
          `Failed to get service parameters: ${serviceParamsResult.response.status()}`,
        );
        test.skip();
      }
    } catch (error: any) {
      console.log(`Failed to create test fee: ${error.message}`);
      test.skip();
    }
  });

  test("BO: Get fee details by code - verify response structure", async () => {
    // Skip if test fee was not created
    if (!testTariffCode || !testFeeCode || !createdFeeData) {
      console.log("Skipping test - test fee not created");
      return;
    }

    console.log("=== Testing fee details retrieval ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Fee Code: ${testFeeCode}`);

    // Get fee details
    const detailsResult = await getFeeDetailsBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
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
    const feeDetails = detailsResult.body;
    console.log("Response body:", JSON.stringify(feeDetails, null, 2));

    // Check all required fields are present
    expect(feeDetails).toHaveProperty("code");
    expect(feeDetails).toHaveProperty("name");
    expect(feeDetails).toHaveProperty("asset_code");
    expect(feeDetails).toHaveProperty("service_code");
    expect(feeDetails).toHaveProperty("service_parameter");
    expect(feeDetails).toHaveProperty("service_parameter_name");
    expect(feeDetails).toHaveProperty("billing_period");
    expect(feeDetails).toHaveProperty("fixed_value");
    expect(feeDetails).toHaveProperty("expression_value");
    expect(feeDetails).toHaveProperty("value_json");

    console.log("All required fields present");

    // Verify field values match what we created
    expect(feeDetails.code).toBe(testFeeCode);
    expect(feeDetails.name).toBe(createdFeeData.name);
    expect(feeDetails.asset_code).toBe(createdFeeData.asset_code);
    expect(feeDetails.service_code).toBe(createdFeeData.service_code);
    expect(feeDetails.service_parameter).toBe(createdFeeData.service_parameter);
    expect(feeDetails.service_parameter_name).toBe(
      createdFeeData.service_parameter_name,
    );
    expect(feeDetails.billing_period).toBe(createdFeeData.billing_period);

    console.log(`Fee code matches: ${feeDetails.code}`);
    console.log(`Fee name matches: ${feeDetails.name}`);
    console.log(`Asset code matches: ${feeDetails.asset_code}`);
    console.log(`Service code matches: ${feeDetails.service_code}`);
    console.log(`Service parameter matches: ${feeDetails.service_parameter}`);
    console.log(`Service parameter name: ${feeDetails.service_parameter_name}`);
    console.log(`Billing period matches: ${feeDetails.billing_period}`);

    // Verify fee code format (should be tariff code + additional digits)
    expect(feeDetails.code).toMatch(new RegExp(`^${testTariffCode}\\d+$`));
    console.log(`Fee code format valid: ${feeDetails.code}`);

    // Verify expression_value is an array with our data
    expect(Array.isArray(feeDetails.expression_value)).toBe(true);
    expect(feeDetails.expression_value.length).toBe(1);

    const expression = feeDetails.expression_value[0];
    expect(expression.value_to).toBe(100000);
    expect(expression.percent).toBe(2);
    expect(expression.value_from).toBe(null);
    expect(expression.fixed_value).toBe(null);
    expect(expression.min_value).toBe(null);
    expect(expression.max_value).toBe(null);

    console.log("Expression value verified:");

    // Verify value_json is a string representation
    expect(typeof feeDetails.value_json).toBe("string");
    expect(feeDetails.value_json).toContain("value_to");
    expect(feeDetails.value_json).toContain("percent");
    console.log(
      `Value JSON is string: ${feeDetails.value_json.substring(0, 100)}...`,
    );

    // Parse value_json to verify it matches expression_value
    try {
      const parsedValueJson = JSON.parse(feeDetails.value_json);
      expect(Array.isArray(parsedValueJson)).toBe(true);
      expect(parsedValueJson.length).toBe(1);
      expect(parsedValueJson[0].value_to).toBe(100000);
      expect(parsedValueJson[0].percent).toBe(2);
      console.log("Value JSON parses correctly and matches expression_value");
    } catch (error: any) {
      console.log(`Failed to parse value_json: ${error.message}`);
    }

    // Verify data types
    console.log("\nData type verification:");
    console.log(
      `  code: ${typeof feeDetails.code} (value: ${feeDetails.code})`,
    );
    console.log(
      `  name: ${typeof feeDetails.name} (value: ${feeDetails.name})`,
    );
    console.log(
      `  asset_code: ${typeof feeDetails.asset_code} (value: ${feeDetails.asset_code})`,
    );
    console.log(
      `  service_code: ${typeof feeDetails.service_code} (value: ${feeDetails.service_code})`,
    );
    console.log(
      `  service_parameter: ${typeof feeDetails.service_parameter} (value: ${feeDetails.service_parameter})`,
    );
    console.log(
      `  service_parameter_name: ${typeof feeDetails.service_parameter_name} (value: ${feeDetails.service_parameter_name})`,
    );
    console.log(
      `  billing_period: ${typeof feeDetails.billing_period} (value: ${feeDetails.billing_period})`,
    );
    console.log(
      `  fixed_value: ${typeof feeDetails.fixed_value} (value: ${feeDetails.fixed_value})`,
    );
    console.log(
      `  expression_value: ${Array.isArray(feeDetails.expression_value) ? "array" : typeof feeDetails.expression_value}`,
    );
    console.log(`  value_json: ${typeof feeDetails.value_json}`);

    expect(typeof feeDetails.code).toBe("string");
    expect(typeof feeDetails.name).toBe("string");
    expect(typeof feeDetails.asset_code).toBe("string");
    expect(typeof feeDetails.service_code).toBe("string");
    expect(typeof feeDetails.service_parameter).toBe("string");
    expect(typeof feeDetails.service_parameter_name).toBe("string");
    expect(typeof feeDetails.billing_period).toBe("string");
    expect(Array.isArray(feeDetails.expression_value)).toBe(true);
    expect(typeof feeDetails.value_json).toBe("string");

    console.log("\nFee details test completed successfully");
  });
});
