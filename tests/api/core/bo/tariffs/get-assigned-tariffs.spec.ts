import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { getAssignedTariffsForRegionsBo } from "@utils/coreService/services/tariffConfiguration/getAssignedTariffsForRegionsBo";
import { getAssignedTariffsForMembersBo } from "@utils/coreService/services/tariffConfiguration/getAssignedTariffsForMembersBo";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { assignTariffToRegionBo } from "@utils/coreService/services/tariffConfiguration/assignTariffToRegionBo";
import { getAvailableMembersForTariffBo } from "@utils/coreService/services/tariffConfiguration/getAvailableMembersForTariffBo";
import { assignTariffToMemberBo } from "@utils/coreService/services/tariffConfiguration/assignTariffToMemberBo";
import { getAllRegions } from "@utils/coreService/regions/getAllRegions";

test.describe("BackOffice - Core Admin - Get Assigned Tariffs", () => {
  let operatorToken: string;
  let testTariffCode: string;
  let testRegion: any;
  let testMember: any;
  let createdTariffs: string[] = [];

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");
  });

  test.beforeEach(async () => {
    // For each test, create a fresh tariff to ensure we have assigned data
    console.log("\n--- Setting up test data ---");

    // Get a region without a tariff
    console.log("Getting regions to find one without tariff...");
    const regionsResult = await getAllRegions(operatorToken);

    if (
      regionsResult.response.status() === 200 &&
      Array.isArray(regionsResult.body)
    ) {
      const regions = regionsResult.body;
      const regionWithoutTariff = regions.find((region: any) => !region.tariff);

      if (regionWithoutTariff) {
        testRegion = regionWithoutTariff;
        console.log(
          `Found region without tariff: ${testRegion.code} (${testRegion.name})`,
        );
      } else {
        // Use the first region and unassign any existing tariff
        testRegion = regions[0];
        console.log(
          `All regions have tariffs, will use: ${testRegion.code} (${testRegion.name})`,
        );
      }
    } else {
      console.log("Failed to get regions, skipping test setup");
      return;
    }

    // Create a test tariff
    const timestamp = Date.now();
    const tariffName = `Test Assigned Tariff ${timestamp} Asset ${testRegion.asset}`;

    console.log(`Creating tariff with name: ${tariffName}`);
    console.log(`Asset code: ${testRegion.asset}`);

    const createResult = await createTariffBo(
      operatorToken,
      tariffName,
      testRegion.asset,
    );

    if (createResult.response.status() === 200) {
      testTariffCode = createResult.body.code;
      createdTariffs.push(testTariffCode);
      console.log(`Test tariff created: ${testTariffCode}`);
    } else {
      console.log(`Failed to create tariff: ${createResult.response.status()}`);
      return;
    }

    // Assign tariff to region
    console.log(
      `Assigning tariff ${testTariffCode} to region ${testRegion.code}...`,
    );
    const assignResult = await assignTariffToRegionBo(
      operatorToken,
      testRegion.code,
      testTariffCode,
    );

    if (assignResult.response.status() === 200) {
      console.log("Tariff assigned to region successfully");
    } else {
      console.log(
        `Failed to assign tariff to region: ${assignResult.response.status()}`,
      );
    }

    // Get an available member for tariff assignment
    console.log("\nGetting available member for tariff assignment...");
    const membersResult = await getAvailableMembersForTariffBo(operatorToken);

    if (membersResult.response.status() === 200) {
      let membersArray;

      // Handle different response structures
      if (Array.isArray(membersResult.body)) {
        membersArray = membersResult.body;
      } else if (
        membersResult.body &&
        typeof membersResult.body === "object" &&
        membersResult.body.content &&
        Array.isArray(membersResult.body.content)
      ) {
        membersArray = membersResult.body.content;
      } else if (
        membersResult.body &&
        typeof membersResult.body === "object" &&
        membersResult.body.data &&
        Array.isArray(membersResult.body.data)
      ) {
        membersArray = membersResult.body.data;
      } else {
        console.log("Could not parse members response");
        return;
      }

      if (membersArray && membersArray.length > 0) {
        // Try to find member with matching asset
        const memberWithMatchingAsset = membersArray.find(
          (member: any) => member.asset === testRegion.asset,
        );
        testMember = memberWithMatchingAsset || membersArray[0];
        console.log(`Selected member: ${testMember.xmi} - ${testMember.name}`);

        // Assign tariff to member
        console.log(
          `Assigning tariff ${testTariffCode} to member ${testMember.xmi}...`,
        );
        const memberAssignResult = await assignTariffToMemberBo(
          operatorToken,
          testMember.xmi,
          testTariffCode,
        );

        if (memberAssignResult.response.status() === 200) {
          console.log("Tariff assigned to member successfully");
        } else {
          console.log(
            `Failed to assign tariff to member: ${memberAssignResult.response.status()}`,
          );
          // Continue anyway, the test might still work for regions
        }
      } else {
        console.log("No members available for tariff assignment");
      }
    }
  });

  test.afterEach(async () => {
    // Clean up: Unassign tariffs from test region and member if they were assigned
    console.log("\n--- Cleaning up test data ---");

    if (testRegion && testTariffCode) {
      console.log(
        `Unassigning tariff ${testTariffCode} from region ${testRegion.code}...`,
      );
      await assignTariffToRegionBo(operatorToken, testRegion.code, "null");
    }

    if (testMember && testTariffCode) {
      console.log(
        `Unassigning tariff ${testTariffCode} from member ${testMember.xmi}...`,
      );
      // Note: To unassign from member, we might need to assign null or a different endpoint
      // This depends on the API implementation
    }
  });

  test("BO: Get list of regions with assigned tariffs - verify response structure", async () => {
    console.log("=== Testing get assigned tariffs for regions ===");

    const result = await getAssignedTariffsForRegionsBo(operatorToken);

    // Verify response
    const response = result.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const responseBody = result.body;
    console.log(`Response body type: ${typeof responseBody}`);

    // The response can be either an array or an object with pagination
    let regionsArray;

    if (Array.isArray(responseBody)) {
      regionsArray = responseBody;
      console.log(`Response is an array with ${regionsArray.length} items`);
    } else if (
      responseBody &&
      typeof responseBody === "object" &&
      responseBody.content &&
      Array.isArray(responseBody.content)
    ) {
      regionsArray = responseBody.content;
      console.log(
        `Response is paginated with ${regionsArray.length} items in content`,
      );
    } else {
      console.log("Unexpected response structure:", responseBody);
    }

    // Verify we have at least one region
    expect(regionsArray.length).toBeGreaterThan(0);
    console.log(`Found ${regionsArray.length} regions with assigned tariffs`);

    // Verify each region has the correct structure
    console.log("\nVerifying region structure...");
    regionsArray.forEach((region: any, index: number) => {
      console.log(`\nRegion ${index + 1}: ${region.code} - ${region.name}`);

      // Check required fields
      expect(region).toHaveProperty("code");
      expect(region).toHaveProperty("name");
      expect(region).toHaveProperty("asset");
      expect(region).toHaveProperty("tariff");

      console.log(`  Code: ${region.code}`);
      console.log(`  Name: ${region.name}`);
      console.log(`  Asset: ${region.asset}`);

      // Verify tariff object structure
      expect(region.tariff).toBeTruthy();
      expect(region.tariff).toHaveProperty("code");
      expect(region.tariff).toHaveProperty("name");

      console.log(`  Tariff Code: ${region.tariff.code}`);
      console.log(`  Tariff Name: ${region.tariff.name}`);
    });

    // Verify our test region and tariff are in the list
    if (testRegion && testTariffCode) {
      const ourRegion = regionsArray.find(
        (region: any) => region.code === testRegion.code,
      );
      if (ourRegion) {
        console.log(`\nFound our test region: ${ourRegion.code}`);
        expect(ourRegion.tariff.code).toBe(testTariffCode);
        console.log(
          `Verified our tariff ${testTariffCode} is assigned to region ${testRegion.code}`,
        );
      } else {
        console.log(
          `\nWarning: Test region ${testRegion.code} not found in the list`,
        );
      }
    }

    // Verify response headers
    const headers = response.headers();
    console.log("\nResponse headers:");

    if (headers["content-type"]) {
      console.log(`Content-Type: ${headers["content-type"]}`);
      expect(headers["content-type"]).toContain("application/json");
    }

    if (headers["content-length"]) {
      console.log(`Content-Length: ${headers["content-length"]}`);
      const contentLength = parseInt(headers["content-length"]);
      expect(contentLength).toBeGreaterThan(0);
    }

    console.log(
      "\nGet assigned tariffs for regions test completed successfully",
    );
  });

  test("BO: Get list of members with assigned tariffs - verify response structure", async () => {
    console.log("=== Testing get assigned tariffs for members ===");

    const result = await getAssignedTariffsForMembersBo(operatorToken);

    // Verify response
    const response = result.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const responseBody = result.body;
    console.log(`Response body type: ${typeof responseBody}`);

    // The response should be a paginated object
    expect(responseBody).toBeTruthy();
    expect(typeof responseBody).toBe("object");
    console.log("Response is an object");

    // Check for pagination properties
    expect(responseBody).toHaveProperty("content");
    expect(Array.isArray(responseBody.content)).toBe(true);

    console.log(
      `Response has content array with ${responseBody.content.length} items`,
    );

    // Check other pagination properties
    const paginationProps = [
      "total_pages",
      "total_elements",
      "number",
      "size",
      "first",
      "last",
      "has_next",
      "has_previous",
    ];

    console.log("\nChecking pagination properties:");
    paginationProps.forEach((prop) => {
      expect(responseBody).toHaveProperty(prop);
      console.log(`  ${prop}: ${responseBody[prop]}`);
    });

    // Verify members array
    const membersArray = responseBody.content;
    expect(membersArray.length).toBeGreaterThan(0);
    console.log(`\nFound ${membersArray.length} members with assigned tariffs`);

    // Verify each member has the correct structure
    console.log("\nVerifying member structure...");
    membersArray.forEach((member: any, index: number) => {
      console.log(`\nMember ${index + 1}: ${member.xmi} - ${member.name}`);

      // Check required fields
      expect(member).toHaveProperty("xmi");
      expect(member).toHaveProperty("name");
      expect(member).toHaveProperty("asset");
      expect(member).toHaveProperty("tariff");
      expect(member).toHaveProperty("ledger_settings");

      console.log(`  XMI: ${member.xmi}`);
      console.log(`  Name: ${member.name}`);
      console.log(`  Asset: ${member.asset}`);

      // Verify country object
      expect(member.country).toBeTruthy();
      expect(member.country).toHaveProperty("code");
      expect(member.country).toHaveProperty("name");
      console.log(`  Country: ${member.country.code} - ${member.country.name}`);

      // Verify region object
      expect(member.region).toBeTruthy();
      expect(member.region).toHaveProperty("code");
      expect(member.region).toHaveProperty("name");
      console.log(`  Region: ${member.region.code} - ${member.region.name}`);

      // Verify tariff object
      expect(member.tariff).toBeTruthy();
      expect(member.tariff).toHaveProperty("code");
      expect(member.tariff).toHaveProperty("name");
      console.log(`  Tariff Code: ${member.tariff.code}`);
      console.log(`  Tariff Name: ${member.tariff.name}`);

      // Verify ledger_settings object
      expect(member.ledger_settings).toBeTruthy();
      expect(member.ledger_settings).toHaveProperty("collateral_amount");
      expect(member.ledger_settings).toHaveProperty("global_base_limit");
      expect(member.ledger_settings).toHaveProperty("global_current_limit");
      console.log(`  Ledger Settings: Available`);

      // Verify other optional fields
      if (member.status) console.log(`  Status: ${member.status}`);
      if (member.kyb_status) console.log(`  KYB Status: ${member.kyb_status}`);
      if (member.branch_name) console.log(`  Branch: ${member.branch_name}`);
    });

    // Verify our test member and tariff are in the list (if assigned successfully)
    if (testMember && testTariffCode) {
      const ourMember = membersArray.find(
        (member: any) => member.xmi === testMember.xmi,
      );
      if (ourMember) {
        console.log(`\nFound our test member: ${ourMember.xmi}`);
        expect(ourMember.tariff.code).toBe(testTariffCode);
        console.log(
          `Verified our tariff ${testTariffCode} is assigned to member ${testMember.xmi}`,
        );
      } else {
        console.log(
          `\nNote: Test member ${testMember.xmi} not found in the list (might not have been assigned)`,
        );
      }
    }

    // Verify response headers
    const headers = response.headers();
    console.log("\nResponse headers:");

    if (headers["content-type"]) {
      console.log(`Content-Type: ${headers["content-type"]}`);
      expect(headers["content-type"]).toContain("application/json");
    }

    if (headers["content-length"]) {
      console.log(`Content-Length: ${headers["content-length"]}`);
      const contentLength = parseInt(headers["content-length"]);
      expect(contentLength).toBeGreaterThan(0);
    }

    console.log(
      "\nGet assigned tariffs for members test completed successfully",
    );
  });
});
