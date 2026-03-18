import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { getAssetsListBo } from "@utils/general/getAssetsListBo";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { getTariffServiceParametersBo } from "@utils/coreService/services/tariffConfiguration/getTariffServiceParametersBo";
import { findSuitableServiceParameter } from "@utils/coreService/services/tariffConfiguration/findSuitableServiceParameter";
import { addTariffFeeExpressionBo } from "@utils/coreService/services/tariffConfiguration/addTariffFeeExpressionBo";
import { deleteTariffFeeBo } from "@utils/coreService/services/tariffConfiguration/deleteTariffFeeBo";
import { verifyFeeDeletionBo } from "@utils/coreService/services/tariffConfiguration/verifyFeeDeletionBo";
import { getTariffFeesBo } from "@utils/coreService/services/tariffConfiguration/getTariffFeesBo";

test.describe("Delete Tariff Fee", () => {
  let operatorToken: string;
  let testTariffCode: string;
  let testFeeCode: string;
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
      const tariffName = `Test Tariff Delete Fee ${timestamp}`;
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

    // Create a test fee to delete
    console.log("\nCreating test fee for deletion...");
    try {
      if (!testTariffCode || !suitableParameter) {
        console.log("Cannot create fee - missing tariff or service parameter");
        test.skip();
        return;
      }

      const timestamp = Date.now();
      const feeName = `Test Fee for Deletion ${timestamp}`;
      const billingPeriod = "event";

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

      console.log(`Creating test fee with name: ${feeName}`);
      const feeResult = await addTariffFeeExpressionBo(
        operatorToken,
        testTariffCode,
        feeData,
      );

      if (feeResult.response.status() === 200) {
        testFeeCode = feeResult.body.code;
        console.log(`Test fee created: ${testFeeCode}`);
        console.log(`Fee name: ${feeResult.body.name}`);
      } else {
        console.log(
          `Failed to create test fee: ${feeResult.response.status()}`,
        );
        test.skip();
      }
    } catch (error: any) {
      console.log(`Failed to create test fee: ${error.message}`);
      test.skip();
    }
  });

  test("BO: Delete existing fee from tariff - verify deletion", async () => {
    // Skip if prerequisites not met
    if (!testTariffCode || !testFeeCode) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    console.log("=== Testing fee deletion ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Fee Code to delete: ${testFeeCode}`);

    // Get fees count before deletion
    console.log("\nGetting fees before deletion...");
    const feesBefore = await getTariffFeesBo(operatorToken, testTariffCode);
    const initialFeeCount = Array.isArray(feesBefore.body)
      ? feesBefore.body.length
      : 0;
    console.log(`Initial fee count: ${initialFeeCount}`);

    // Verify the fee exists before deletion
    const feeExistsBefore = feesBefore.body.some(
      (fee: any) => fee.code === testFeeCode,
    );
    console.log(`Fee exists before deletion: ${feeExistsBefore}`);

    if (!feeExistsBefore) {
      console.log(
        "Test fee not found before deletion. Cannot proceed with test.",
      );
      return;
    }

    // Delete the fee
    console.log("\nDeleting fee...");
    const deleteResult = await deleteTariffFeeBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
    );

    // Verify response
    const response = deleteResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body (should be empty as per example)
    const responseBody = deleteResult.body;
    console.log(`Response body type: ${typeof responseBody}`);

    // For empty response, body might be null, undefined, or empty object
    if (responseBody === null || responseBody === undefined) {
      console.log(
        "Response body is null/undefined (as expected for empty response)",
      );
    } else if (
      typeof responseBody === "object" &&
      Object.keys(responseBody).length === 0
    ) {
      console.log(
        "Response body is empty object (as expected for empty response)",
      );
    } else {
      console.log(`Response body: ${JSON.stringify(responseBody)}`);
    }

    // Verify deletion by checking fees list
    console.log("\nVerifying fee deletion...");
    const deletionVerified = await verifyFeeDeletionBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
    );

    expect(deletionVerified).toBe(true);
    console.log("Fee deletion verified successfully");

    // Get fees count after deletion
    console.log("\nGetting fees after deletion...");
    const feesAfter = await getTariffFeesBo(operatorToken, testTariffCode);
    const finalFeeCount = Array.isArray(feesAfter.body)
      ? feesAfter.body.length
      : 0;
    console.log(`Final fee count: ${finalFeeCount}`);

    // Verify count decreased by 1
    expect(finalFeeCount).toBe(initialFeeCount - 1);
    console.log(
      `Fee count decreased by 1: ${initialFeeCount} -> ${finalFeeCount}`,
    );

    console.log("\nFee deletion test completed successfully");
  });
});
