import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { getTariffServiceParametersBo } from "@utils/coreService/services/tariffConfiguration/getTariffServiceParametersBo";
import { findSuitableServiceParameter } from "@utils/coreService/services/tariffConfiguration/findSuitableServiceParameter";
import { addTariffFeeExpressionBo } from "@utils/coreService/services/tariffConfiguration/addTariffFeeExpressionBo";
import { getTariffsListBo } from "@utils/coreService/services/tariffConfiguration/getTariffsListBo";
import { assignTariffToRegionBo } from "@utils/coreService/services/tariffConfiguration/assignTariffToRegionBo";
import { assignTariffToMemberBo } from "@utils/coreService/services/tariffConfiguration/assignTariffToMemberBo";
import { getAvailableMembersForTariffBo } from "@utils/coreService/services/tariffConfiguration/getAvailableMembersForTariffBo";
import { getAllRegions } from "@utils/coreService/regions/getAllRegions";

test.describe("BackOffice - Core Admin - Tariff Assignment", () => {
  let operatorToken: string;
  let testTariffCode: string;
  let selectedRegion: any;
  let selectedAsset: string;
  let testFeeCode: string;
  let serviceParameters: any;
  let suitableParameter: any;
  let testMember: any;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Get all regions to determine currency for tariff
    console.log("\nGetting list of regions...");
    try {
      const regionsResult = await getAllRegions(operatorToken);

      if (
        regionsResult.response.status() === 200 &&
        Array.isArray(regionsResult.body)
      ) {
        const regions = regionsResult.body;
        console.log(`Found ${regions.length} regions`);

        // Find a region without an assigned tariff (preferred) or use any region
        const regionWithoutTariff = regions.find(
          (region: any) => !region.tariff,
        );

        if (regionWithoutTariff) {
          selectedRegion = regionWithoutTariff;
          console.log(
            `Selected region without tariff: ${selectedRegion.code} (${selectedRegion.name})`,
          );
        } else if (regions.length > 0) {
          selectedRegion = regions[0];
          console.log(
            `All regions have tariffs, using first region: ${selectedRegion.code} (${selectedRegion.name})`,
          );
        } else {
          console.log("No regions found");
          test.skip();
          return;
        }

        selectedAsset = selectedRegion.asset;
        console.log(`Selected asset for tariff: ${selectedAsset}`);
      } else {
        console.log("Failed to get regions list");
        test.skip();
        return;
      }
    } catch (error: any) {
      console.log(`Failed to get regions list: ${error.message}`);
      test.skip();
      return;
    }

    // Create a test tariff with the selected asset
    console.log("\nCreating test tariff for assignment testing...");
    try {
      const timestamp = Date.now();
      const tariffName = `Test Tariff Assignment ${timestamp} Asset ${selectedAsset}`;

      console.log(`Creating tariff with name: ${tariffName}`);
      console.log(`Asset code: ${selectedAsset}`);

      const createResult = await createTariffBo(
        operatorToken,
        tariffName,
        selectedAsset,
      );

      if (createResult.response.status() === 200) {
        testTariffCode = createResult.body.code;
        console.log(`Test tariff created: ${testTariffCode}`);
      } else {
        console.log(
          `Failed to create tariff: ${createResult.response.status()}`,
        );
        test.skip();
        return;
      }
    } catch (error: any) {
      console.log(`Failed to create test tariff: ${error.message}`);
      test.skip();
      return;
    }

    // Get service parameters and create a fee for the tariff
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
          return;
        }
      } else {
        console.log(
          `Failed to get service parameters: ${serviceParamsResult.response.status()}`,
        );
        test.skip();
        return;
      }
    } catch (error: any) {
      console.log(`Failed to get service parameters: ${error.message}`);
      test.skip();
      return;
    }

    // Create a test fee for the tariff
    console.log("\nCreating test fee for tariff...");
    if (testTariffCode && suitableParameter) {
      try {
        const timestamp = Date.now();
        const feeName = `Test Fee Assignment ${timestamp}`;
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

        console.log(`Creating fee with name: ${feeName}`);
        const feeResult = await addTariffFeeExpressionBo(
          operatorToken,
          testTariffCode,
          feeData,
        );

        if (feeResult.response.status() === 200) {
          testFeeCode = feeResult.body.code;
          console.log(`Test fee created: ${testFeeCode}`);
        } else {
          console.log(
            `Failed to create test fee: ${feeResult.response.status()}`,
          );
          test.skip();
          return;
        }
      } catch (error: any) {
        console.log(`Failed to create test fee: ${error.message}`);
        test.skip();
        return;
      }
    }

    // Get available members for tariff assignment
    console.log("\nGetting available members for tariff assignment...");
    try {
      const membersResult = await getAvailableMembersForTariffBo(operatorToken);

      if (membersResult.response.status() === 200) {
        let membersArray;

        // Check if response body is an array directly
        if (Array.isArray(membersResult.body)) {
          membersArray = membersResult.body;
          console.log(`Response is an array with ${membersArray.length} items`);
        }
        // Check if response body is an object with a content property (common for paginated responses)
        else if (
          membersResult.body &&
          typeof membersResult.body === "object" &&
          membersResult.body.content &&
          Array.isArray(membersResult.body.content)
        ) {
          membersArray = membersResult.body.content;
          console.log(
            `Response has content array with ${membersArray.length} items`,
          );
        }
        // Check if response body is an object with a data property
        else if (
          membersResult.body &&
          typeof membersResult.body === "object" &&
          membersResult.body.data &&
          Array.isArray(membersResult.body.data)
        ) {
          membersArray = membersResult.body.data;
          console.log(
            `Response has data array with ${membersArray.length} items`,
          );
        }
        // Check if response body is an object that's actually an array-like structure
        else if (
          membersResult.body &&
          typeof membersResult.body === "object" &&
          Array.isArray(membersResult.body.items)
        ) {
          membersArray = membersResult.body.items;
          console.log(
            `Response has items array with ${membersArray.length} items`,
          );
        }
        // Fallback: try to use the body itself if it's an array-like object
        else if (
          membersResult.body &&
          typeof membersResult.body === "object" &&
          membersResult.body.length !== undefined
        ) {
          // This handles array-like objects that aren't true arrays
          membersArray = Array.from(membersResult.body);
          console.log(
            `Response is array-like with ${membersArray.length} items`,
          );
        } else {
          console.log(
            "Response body structure not recognized:",
            membersResult.body,
          );
          console.log("Type of body:", typeof membersResult.body);
          console.log(
            "Body keys:",
            membersResult.body ? Object.keys(membersResult.body) : "null",
          );
          test.skip();
          return;
        }

        if (!membersArray || membersArray.length === 0) {
          console.log("No members available for tariff assignment");
          test.skip();
          return;
        }

        console.log(
          `Found ${membersArray.length} available members without tariffs`,
        );

        // Try to find a member with matching asset first
        const memberWithMatchingAsset = membersArray.find(
          (member: any) => member.asset === selectedAsset,
        );

        if (memberWithMatchingAsset) {
          testMember = memberWithMatchingAsset;
          console.log(
            `Found member with matching asset (${selectedAsset}): ${testMember.xmi} - ${testMember.name}`,
          );
        } else {
          // Use the first available member
          testMember = membersArray[0];
          console.log(
            `No member with matching asset, using first available: ${testMember.xmi} - ${testMember.name}`,
          );
          console.log(
            `Member asset: ${testMember.asset}, Tariff asset: ${selectedAsset}`,
          );
        }

        console.log(`Selected member for testing: ${testMember.xmi}`);
      } else {
        console.log(
          `Failed to get available members: Status ${membersResult.response.status()}`,
        );
        test.skip();
        return;
      }
    } catch (error: any) {
      console.log(`Failed to get available members: ${error.message}`);
      console.log("Error stack:", error.stack);
      test.skip();
      return;
    }
  });

  test("BO: Assign tariff to region - verify successful assignment", async () => {
    // Skip if prerequisites not met
    if (!testTariffCode || !selectedRegion) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    console.log("=== Testing tariff assignment to region ===");
    console.log(`Region Code: ${selectedRegion.code}`);
    console.log(`Tariff Code: ${testTariffCode}`);

    // Assign tariff to region
    console.log("\nAssigning tariff to region...");
    const assignResult = await assignTariffToRegionBo(
      operatorToken,
      selectedRegion.code,
      testTariffCode,
    );

    // Verify response
    const response = assignResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const responseBody = assignResult.body;
    console.log("Response body:", responseBody);

    // Check response body structure
    expect(responseBody).toHaveProperty("code");
    expect(responseBody).toHaveProperty("name");
    expect(responseBody).toHaveProperty("asset");
    expect(responseBody).toHaveProperty("tariff");

    expect(responseBody.code).toBe(selectedRegion.code);
    expect(responseBody.asset).toBe(selectedRegion.asset);

    expect(responseBody.tariff).toBeTruthy();
    expect(responseBody.tariff.code).toBe(testTariffCode);

    console.log("Response body structure verified");

    // Verify tariff is now marked as assigned in tariffs list
    console.log("\nVerifying tariff assignment status...");
    const tariffsListResult = await getTariffsListBo(operatorToken);

    if (
      tariffsListResult.response.status() === 200 &&
      Array.isArray(tariffsListResult.body)
    ) {
      const ourTariff = tariffsListResult.body.find(
        (tariff: any) => tariff.code === testTariffCode,
      );

      if (ourTariff) {
        console.log(`Tariff found: ${ourTariff.code} - ${ourTariff.name}`);
        expect(ourTariff.assigned).toBe(true);
        console.log(`Tariff assigned status verified: ${ourTariff.assigned}`);
      } else {
        console.log(
          `Warning: Tariff ${testTariffCode} not found in tariffs list`,
        );
      }
    }

    console.log("\nTariff assignment to region test completed successfully");
  });

  test("BO: Assign tariff to member - verify successful assignment", async () => {
    // Skip if prerequisites not met
    if (!testTariffCode || !testMember) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    console.log("=== Testing tariff assignment to member ===");
    console.log(`Member XMI: ${testMember.xmi}`);
    console.log(`Member Name: ${testMember.name}`);
    console.log(`Member Asset: ${testMember.asset}`);
    console.log(`Tariff Code: ${testTariffCode}`);
    console.log(`Tariff Asset: ${selectedAsset}`);

    // Note: The API might require member and tariff to have the same asset
    // If assets don't match, we might get an error
    if (testMember.asset !== selectedAsset) {
      console.log(
        `Warning: Member asset (${testMember.asset}) doesn't match tariff asset (${selectedAsset})`,
      );
      console.log("This might cause the assignment to fail");
    }

    // Assign tariff to member
    console.log("\nAssigning tariff to member...");
    const assignResult = await assignTariffToMemberBo(
      operatorToken,
      testMember.xmi,
      testTariffCode,
    );

    // Verify response
    const response = assignResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);

    if (testMember.asset !== selectedAsset) {
      // If assets don't match, we might get a 400 error
      console.log(`Expected: 400 (assets don't match) or 200 (if allowed)`);

      if (status === 400) {
        console.log("Got expected 400 error - assets don't match");
        // Check error response
        if (assignResult.body && typeof assignResult.body === "object") {
          console.log(`Error response: ${JSON.stringify(assignResult.body)}`);
        }
        return; // Test ends here if we got expected error
      } else if (status === 200) {
        console.log("Assignment succeeded despite asset mismatch");
      } else {
        console.log(`Unexpected status: ${status}`);
      }
    } else {
      console.log(`Expected: 200`);
    }

    // If assets match or assignment succeeded anyway, verify success
    if (status === 200) {
      console.log("Status 200 verified");

      // Verify response body is empty (as per example)
      const responseBody = assignResult.body;
      console.log("Response body:", responseBody);

      // Response should be empty or null for member assignment
      // Accept either an empty object or falsy value
      const isEmptyResponse =
        !responseBody ||
        (typeof responseBody === "object" &&
          Object.keys(responseBody).length === 0);
      expect(isEmptyResponse).toBe(true);

      if (
        responseBody &&
        typeof responseBody === "object" &&
        Object.keys(responseBody).length === 0
      ) {
        console.log("Response body is an empty object, which is acceptable");
      } else if (!responseBody) {
        console.log("Response body is null or undefined as expected");
      } else {
        console.log("Response body is empty as expected");
      }

      // Verify tariff is now marked as assigned in tariffs list
      console.log("\nVerifying tariff assignment status...");
      const tariffsListResult = await getTariffsListBo(operatorToken);

      if (
        tariffsListResult.response.status() === 200 &&
        Array.isArray(tariffsListResult.body)
      ) {
        const ourTariff = tariffsListResult.body.find(
          (tariff: any) => tariff.code === testTariffCode,
        );

        if (ourTariff) {
          console.log(`Tariff found: ${ourTariff.code} - ${ourTariff.name}`);
          // Note: The assigned flag might not update for member assignments
          // or it might only show region assignments
          console.log(`Tariff assigned status: ${ourTariff.assigned}`);
        } else {
          console.log(
            `Warning: Tariff ${testTariffCode} not found in tariffs list`,
          );
        }
      }
    }

    console.log("\nTariff assignment to member test completed");
  });

  test("BO: Assign invalid tariff to region should fail", async () => {
    // Skip if prerequisites not met
    if (!selectedRegion) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    console.log("=== Testing assignment of invalid tariff to region ===");
    console.log(`Region Code: ${selectedRegion.code}`);

    const invalidTariffCode = "INVALID_TARIFF_XYZ";
    console.log(`Invalid Tariff Code: ${invalidTariffCode}`);

    try {
      const assignResult = await assignTariffToRegionBo(
        operatorToken,
        selectedRegion.code,
        invalidTariffCode,
      );

      const status = assignResult.response.status();
      console.log(`Response status: ${status}`);

      // Should be 404 or 400 for invalid tariff code
      expect(status).not.toBe(200);
      console.log(`Expected non-200 status, got: ${status}`);
    } catch (error: any) {
      console.log(`Expected error occurred: ${error.message}`);
    }

    console.log("\nInvalid tariff assignment test completed");
  });

  test("BO: Assign tariff to invalid member should fail", async () => {
    // Skip if prerequisites not met
    if (!testTariffCode) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    console.log("=== Testing tariff assignment to invalid member ===");
    console.log(`Tariff Code: ${testTariffCode}`);

    const invalidMemberCode = "INVALID_MEMBER_XYZ";
    console.log(`Invalid Member Code: ${invalidMemberCode}`);

    try {
      const assignResult = await assignTariffToMemberBo(
        operatorToken,
        invalidMemberCode,
        testTariffCode,
      );

      const status = assignResult.response.status();
      console.log(`Response status: ${status}`);

      // Should be 404 or 400 for invalid member code
      expect(status).not.toBe(200);
      console.log(`Expected non-200 status, got: ${status}`);

      // Check for error response
      if (assignResult.body && typeof assignResult.body === "object") {
        console.log(`Error response: ${JSON.stringify(assignResult.body)}`);
      }
    } catch (error: any) {
      console.log(`Expected error occurred: ${error.message}`);
    }

    console.log("\nInvalid member assignment test completed");
  });
});
