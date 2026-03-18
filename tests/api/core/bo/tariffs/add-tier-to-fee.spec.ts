import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { addTariffFeeExpressionBo } from "@utils/coreService/services/tariffConfiguration/addTariffFeeExpressionBo";
import { updateFeeExpressionBo } from "@utils/coreService/services/tariffConfiguration/updateFeeExpressionBo";
import { getFeeDetailsBo } from "@utils/coreService/services/tariffConfiguration/getFeeDetailsBo";

test.describe("BackOffice - Core Admin - Add Tier to Fee", () => {
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
    console.log("\nCreating test tariff for tier testing...");
    try {
      const timestamp = Date.now();
      const tariffName = `Test Tariff Tier ${timestamp}`;

      // Create tariff with EUR asset
      const createResult = await createTariffBo(
        operatorToken,
        tariffName,
        "EUR",
      );

      if (createResult.response.status() === 200) {
        testTariffCode = createResult.body.code;
        console.log(`Test tariff created: ${testTariffCode}`);

        // Create a fee with one tier initially
        console.log("\nCreating fee with one tier...");

        const feeData = {
          name: `Test Fee with Tier ${timestamp}`,
          service_parameter: "trade_amount", // Using trade_amount as in example
          billing_period: "event",
          charge_side: null,
          value: [
            {
              value_from: 12,
              value_to: null,
              min_value: null,
              max_value: null,
              percent: 1,
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

  test("BO: Add new tier to fee - from 1 tier to 2 tiers", async () => {
    // Skip if test fee was not created
    if (!testTariffCode || !testFeeCode || !originalFeeData) {
      console.log("Skipping test - test fee not created");
      return;
    }

    console.log("=== Testing adding new tier to fee ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Fee Code: ${testFeeCode}`);
    console.log(`Original tiers: ${originalFeeData.expression_value.length}`);

    // Prepare updated fee data with 2 tiers
    const updatedFeeData = {
      name: originalFeeData.name,
      service_parameter: originalFeeData.service_parameter,
      billing_period: originalFeeData.billing_period,
      value: [
        {
          value_from: 12,
          value_to: 30,
          min_value: null,
          max_value: null,
          percent: 1,
          fixed_value: null,
        },
        {
          value_from: 30.01,
          value_to: 100,
          min_value: null,
          max_value: null,
          percent: 2,
          fixed_value: null,
        },
      ],
    };

    console.log(
      "\nUpdated fee data with 2 tiers:",
      JSON.stringify(updatedFeeData.value, null, 2),
    );

    // Update fee expression with new tier
    console.log("\nUpdating fee expression with new tier...");
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

    // Check fee code remains the same
    expect(updatedFee.code).toBe(testFeeCode);
    console.log(`Fee code unchanged: ${updatedFee.code}`);

    // Verify we now have 2 tiers
    expect(Array.isArray(updatedFee.expression_value)).toBe(true);
    expect(updatedFee.expression_value.length).toBe(2);
    console.log(`Now has ${updatedFee.expression_value.length} tiers (was: 1)`);

    // Verify first tier values
    const firstTier = updatedFee.expression_value[0];
    expect(firstTier.value_from).toBe(12);
    expect(firstTier.value_to).toBe(30);
    expect(firstTier.percent).toBe(1);

    console.log("\nFirst tier verified:");
    console.log(`  value_from: ${firstTier.value_from}`);
    console.log(`  value_to: ${firstTier.value_to}`);
    console.log(`  percent: ${firstTier.percent}`);

    // Verify second tier values
    const secondTier = updatedFee.expression_value[1];
    expect(secondTier.value_from).toBe(30.01);
    expect(secondTier.value_to).toBe(100);
    expect(secondTier.percent).toBe(2);

    console.log("\nSecond tier verified:");
    console.log(`  value_from: ${secondTier.value_from}`);
    console.log(`  value_to: ${secondTier.value_to}`);
    console.log(`  percent: ${secondTier.percent}`);

    // Verify tiers have proper ranges (second tier starts where first tier ends)
    expect(firstTier.value_to).toBe(30);
    expect(secondTier.value_from).toBe(30.01);
    console.log("\nTier ranges are continuous:");

    // Verify value_json is updated
    expect(typeof updatedFee.value_json).toBe("string");
    expect(updatedFee.value_json).toContain('"value_from":12');
    expect(updatedFee.value_json).toContain('"value_to":30');
    expect(updatedFee.value_json).toContain('"value_from":30.01');
    expect(updatedFee.value_json).toContain('"value_to":100');

    console.log(`Value JSON updated with 2 tiers`);

    console.log("\nAdd tier test completed successfully");
  });

  test("BO: Add third tier to fee - from 2 tiers to 3 tiers", async () => {
    // Skip if test fee was not created
    if (!testTariffCode || !testFeeCode) {
      console.log("Skipping test - test fee not created");
      return;
    }

    console.log("=== Testing adding third tier to fee ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Fee Code: ${testFeeCode}`);

    // First, get current fee details (should have 2 tiers from previous test)
    console.log("\nGetting current fee details...");
    const currentDetails = await getFeeDetailsBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
    );
    expect(currentDetails.response.status()).toBe(200);

    const currentFee = currentDetails.body;
    console.log(`Current tiers: ${currentFee.expression_value.length}`);

    // Prepare updated fee data with 3 tiers
    const updatedFeeData = {
      name: currentFee.name,
      service_parameter: currentFee.service_parameter,
      billing_period: currentFee.billing_period,
      value: [
        {
          value_from: 12,
          value_to: 30,
          min_value: null,
          max_value: null,
          percent: 1,
          fixed_value: null,
        },
        {
          value_from: 30.01,
          value_to: 100,
          min_value: null,
          max_value: null,
          percent: 2,
          fixed_value: null,
        },
        {
          value_from: 100.01,
          value_to: null,
          min_value: null,
          max_value: null,
          percent: 3,
          fixed_value: null,
        },
      ],
    };

    console.log("\nUpdating fee with 3 tiers...");
    console.log(
      "Tier structure:",
      JSON.stringify(updatedFeeData.value, null, 2),
    );

    const updateResult = await updateFeeExpressionBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
      updatedFeeData,
    );

    expect(updateResult.response.status()).toBe(200);

    const updatedFee = updateResult.body;
    expect(updatedFee.expression_value.length).toBe(3);

    console.log(`Fee updated to ${updatedFee.expression_value.length} tiers`);

    // Verify all three tiers
    updatedFee.expression_value.forEach((tier: any, index: number) => {
      console.log(
        `  Tier ${index + 1}: ${tier.value_from} to ${tier.value_to}, ${tier.percent}%`,
      );
    });

    // Verify tier continuity
    const tiers = updatedFee.expression_value;
    expect(tiers[0].value_to).toBe(30);
    expect(tiers[1].value_from).toBe(30.01);
    expect(tiers[1].value_to).toBe(100);
    expect(tiers[2].value_from).toBe(100.01);
    expect(tiers[2].value_to).toBe(null); // Last tier has no upper limit

    console.log("\nTier continuity verified");

    console.log("\nThird tier test completed");
  });

  test("BO: Test tier with different value types", async () => {
    // Skip if test fee was not created
    if (!testTariffCode || !testFeeCode) {
      console.log("Skipping test - test fee not created");
      return;
    }

    console.log("=== Testing tier with different value types ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Fee Code: ${testFeeCode}`);

    // First, get current fee details
    const currentDetails = await getFeeDetailsBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
    );
    const currentFee = currentDetails.body;

    // Create fee data with different value types in different tiers
    const mixedFeeData = {
      name: currentFee.name,
      service_parameter: currentFee.service_parameter,
      billing_period: currentFee.billing_period,
      value: [
        {
          value_from: 0,
          value_to: 100,
          min_value: 5,
          max_value: 20,
          percent: 1,
          fixed_value: null,
        },
        {
          value_from: 100.01,
          value_to: 500,
          min_value: null,
          max_value: null,
          percent: null,
          fixed_value: 10, // Fixed value instead of percentage
        },
        {
          value_from: 500.01,
          value_to: null,
          min_value: 15,
          max_value: null, // No maximum limit
          percent: 2,
          fixed_value: null,
        },
      ],
    };

    console.log("\nUpdating fee with mixed value types...");
    console.log("Tier 1: Percentage with min/max limits");
    console.log("Tier 2: Fixed value");
    console.log("Tier 3: Percentage with min limit only");

    const updateResult = await updateFeeExpressionBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
      mixedFeeData,
    );

    expect(updateResult.response.status()).toBe(200);

    const updatedFee = updateResult.body;

    // Verify each tier has the correct value type
    const tiers = updatedFee.expression_value;

    // Tier 1: Percentage with min/max
    expect(tiers[0].percent).toBe(1);
    expect(tiers[0].fixed_value).toBe(null);
    expect(tiers[0].min_value).toBe(5);
    expect(tiers[0].max_value).toBe(20);

    // Tier 2: Fixed value
    expect(tiers[1].percent).toBe(null);
    expect(tiers[1].fixed_value).toBe(10);
    expect(tiers[1].min_value).toBe(null);
    expect(tiers[1].max_value).toBe(null);

    // Tier 3: Percentage with min only
    expect(tiers[2].percent).toBe(2);
    expect(tiers[2].fixed_value).toBe(null);
    expect(tiers[2].min_value).toBe(15);
    expect(tiers[2].max_value).toBe(null);

    console.log("\nMixed value types verified:");
    console.log(
      `  Tier 1: ${tiers[0].percent}% (min: ${tiers[0].min_value}, max: ${tiers[0].max_value})`,
    );
    console.log(`  Tier 2: fixed ${tiers[1].fixed_value}`);
    console.log(`  Tier 3: ${tiers[2].percent}% (min: ${tiers[2].min_value})`);

    console.log("\nMixed value types test completed");
  });

  test("BO: Test overlapping tier ranges should work or fail", async () => {
    // Skip if test fee was not created
    if (!testTariffCode || !testFeeCode) {
      console.log("Skipping test - test fee not created");
      return;
    }

    console.log("=== Testing overlapping tier ranges ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Fee Code: ${testFeeCode}`);

    // First, get current fee details
    const currentDetails = await getFeeDetailsBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
    );
    const currentFee = currentDetails.body;

    // Try overlapping ranges (tier 2 starts before tier 1 ends)
    const overlappingFeeData = {
      name: currentFee.name,
      service_parameter: currentFee.service_parameter,
      billing_period: currentFee.billing_period,
      value: [
        {
          value_from: 0,
          value_to: 50,
          min_value: null,
          max_value: null,
          percent: 1,
          fixed_value: null,
        },
        {
          value_from: 40, // Overlaps with tier 1 (0-50)
          value_to: 100,
          min_value: null,
          max_value: null,
          percent: 2,
          fixed_value: null,
        },
      ],
    };

    console.log("\nTrying overlapping tier ranges:");
    console.log("Tier 1: 0-50");
    console.log("Tier 2: 40-100 (overlaps with tier 1)");

    const updateResult = await updateFeeExpressionBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
      overlappingFeeData,
    );

    const status = updateResult.response.status();
    console.log(`Response status: ${status}`);

    // API might accept or reject overlapping ranges
    if (status === 200) {
      console.log("API accepted overlapping tier ranges");

      // Verify the update worked
      const updatedFee = updateResult.body;
      console.log(
        `Fee updated with ${updatedFee.expression_value.length} tiers`,
      );
    } else if (status === 400) {
      console.log(
        "API rejected overlapping tier ranges (expected validation error)",
      );
    } else {
      console.log(`Unexpected status: ${status}`);
    }

    console.log("\nOverlapping ranges test completed");
  });

  test("BO: Test gap between tier ranges", async () => {
    // Skip if test fee was not created
    if (!testTariffCode || !testFeeCode) {
      console.log("Skipping test - test fee not created");
      return;
    }

    console.log("=== Testing gap between tier ranges ===");
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Fee Code: ${testFeeCode}`);

    // First, get current fee details
    const currentDetails = await getFeeDetailsBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
    );
    const currentFee = currentDetails.body;

    // Try creating a gap between tiers
    const gappedFeeData = {
      name: currentFee.name,
      service_parameter: currentFee.service_parameter,
      billing_period: currentFee.billing_period,
      value: [
        {
          value_from: 0,
          value_to: 50,
          min_value: null,
          max_value: null,
          percent: 1,
          fixed_value: null,
        },
        {
          value_from: 60, // Gap between 50-60
          value_to: 100,
          min_value: null,
          max_value: null,
          percent: 2,
          fixed_value: null,
        },
      ],
    };

    console.log("\nTrying tier ranges with gap:");
    console.log("Tier 1: 0-50");
    console.log("Tier 2: 60-100 (gap between 50-60)");

    const updateResult = await updateFeeExpressionBo(
      operatorToken,
      testTariffCode,
      testFeeCode,
      gappedFeeData,
    );

    const status = updateResult.response.status();
    console.log(`Response status: ${status}`);

    if (status === 200) {
      console.log("API accepted tier ranges with gap");

      const updatedFee = updateResult.body;
      const tiers = updatedFee.expression_value;

      // Check if there's actually a gap
      expect(tiers[0].value_to).toBe(50);
      expect(tiers[1].value_from).toBe(60);

      const gapSize = tiers[1].value_from - tiers[0].value_to;
      console.log(`Gap size between tiers: ${gapSize}`);

      console.log(
        "Note: Values between 50 and 60 would not be covered by any tier",
      );
    } else if (status === 400) {
      console.log("API rejected tier ranges with gap");
    } else {
      console.log(`Unexpected status: ${status}`);
    }

    console.log("\nGap test completed");
  });
});
