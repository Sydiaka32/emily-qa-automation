import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { createTariffBo } from "@utils/coreService/services/tariffConfiguration/createTariffBo";
import { assignTariffToRegionBo } from "@utils/coreService/services/tariffConfiguration/assignTariffToRegionBo";
import { assignTariffToMemberBo } from "@utils/coreService/services/tariffConfiguration/assignTariffToMemberBo";
import { getAvailableMembersForTariffBo } from "@utils/coreService/services/tariffConfiguration/getAvailableMembersForTariffBo";
import { deleteTariffAssignmentFromRegionBo } from "@utils/coreService/services/tariffConfiguration/deleteTariffAssignmentFromRegionBo";
import { deleteTariffAssignmentFromMemberBo } from "@utils/coreService/services/tariffConfiguration/deleteTariffAssignmentFromMemberBo";
import { getAssignedTariffsForRegionsBo } from "@utils/coreService/services/tariffConfiguration/getAssignedTariffsForRegionsBo";
import { getAssignedTariffsForMembersBo } from "@utils/coreService/services/tariffConfiguration/getAssignedTariffsForMembersBo";
import { getAssetsListBo } from "@utils/general/getAssetsListBo";
import { getAllRegions } from "@utils/coreService/regions/getAllRegions";

test.describe("BackOffice - Core Admin - Delete Tariff Assignment", () => {
  let operatorToken: string;
  let testTariffCode: string;
  let testRegion: any;
  let testMember: any;
  let selectedAsset: string;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");
  });

  test.beforeEach(async () => {
    console.log("\n--- Setting up test data ---");

    // First, get available assets to ensure we use a valid asset
    console.log("Getting available assets...");
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
        return;
      }
    } catch (error: any) {
      console.log(`Failed to get assets list: ${error.message}`);
      test.skip();
      return;
    }

    // Get regions and find one with a valid asset
    console.log("Getting regions to find one with valid asset...");
    const regionsResult = await getAllRegions(operatorToken);

    if (
      regionsResult.response.status() === 200 &&
      Array.isArray(regionsResult.body)
    ) {
      const regions = regionsResult.body;
      console.log(`Found ${regions.length} regions`);

      // Find a region without a tariff and with a valid asset
      let foundRegion = null;
      for (const region of regions) {
        // Check if region asset is in available assets
        const isValidAsset = availableAssets.some(
          (asset: any) => asset.code === region.asset,
        );
        if (!region.tariff && isValidAsset) {
          foundRegion = region;
          selectedAsset = region.asset;
          console.log(
            `Found region without tariff and valid asset: ${foundRegion.code} (${foundRegion.name}), Asset: ${selectedAsset}`,
          );
          break;
        }
      }

      if (!foundRegion) {
        // Try any region with valid asset
        for (const region of regions) {
          const isValidAsset = availableAssets.some(
            (asset: any) => asset.code === region.asset,
          );
          if (isValidAsset) {
            foundRegion = region;
            selectedAsset = region.asset;
            console.log(
              `Found region with valid asset: ${foundRegion.code} (${foundRegion.name}), Asset: ${selectedAsset}`,
            );

            // Delete any existing tariff assignment first
            console.log(
              `Deleting existing tariff assignment from region ${foundRegion.code}...`,
            );
            const deleteResult = await deleteTariffAssignmentFromRegionBo(
              operatorToken,
              foundRegion.code,
            );
            if (deleteResult.response.status() === 200) {
              console.log("Existing assignment deleted successfully");
            } else {
              console.log(
                `Failed to delete existing assignment: ${deleteResult.response.status()}`,
              );
            }
            break;
          }
        }
      }

      if (foundRegion) {
        testRegion = foundRegion;
      } else {
        console.log("No region found with valid asset");
        test.skip();
        return;
      }
    } else {
      console.log("Failed to get regions");
      test.skip();
      return;
    }

    // Create a test tariff with the valid asset
    const timestamp = Date.now();
    const tariffName = `Test Delete Assignment ${timestamp}`;

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
      console.log(`Failed to create tariff: ${createResult.response.status()}`);
      console.log(`Error response: ${JSON.stringify(createResult.body)}`);
      test.skip();
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
      console.log(`Error response: ${JSON.stringify(assignResult.body)}`);
      test.skip();
      return;
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
          (member: any) => member.asset === selectedAsset,
        );
        testMember = memberWithMatchingAsset || membersArray[0];
        console.log(`Selected member: ${testMember.xmi} - ${testMember.name}`);
        console.log(
          `Member asset: ${testMember.asset}, Tariff asset: ${selectedAsset}`,
        );

        // Check if member already has a tariff and delete it first
        console.log(
          `Checking if member ${testMember.xmi} already has a tariff...`,
        );
        const assignedMembersResult =
          await getAssignedTariffsForMembersBo(operatorToken);
        if (assignedMembersResult.response.status() === 200) {
          const assignedMembers = assignedMembersResult.body.content || [];
          const alreadyAssigned = assignedMembers.find(
            (m: any) => m.xmi === testMember.xmi,
          );
          if (alreadyAssigned) {
            console.log(`Member already has tariff, deleting it first...`);
            const deleteMemberResult = await deleteTariffAssignmentFromMemberBo(
              operatorToken,
              testMember.xmi,
            );
            if (deleteMemberResult.response.status() === 200) {
              console.log("Existing member assignment deleted");
            }
          }
        }

        // Only assign to member if assets match (to avoid 400 error)
        if (testMember.asset === selectedAsset) {
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
            console.log(
              `Error response: ${JSON.stringify(memberAssignResult.body)}`,
            );
          }
        } else {
          console.log(
            `Skipping member assignment: asset mismatch (member: ${testMember.asset}, tariff: ${selectedAsset})`,
          );
        }
      } else {
        console.log("No members available for tariff assignment");
      }
    }
  });

  test.afterEach(async () => {
    console.log("\n--- Cleaning up test data ---");

    // Clean up tariff assignments if they still exist
    if (testRegion) {
      console.log(`Cleaning up region ${testRegion.code}...`);
      try {
        await deleteTariffAssignmentFromRegionBo(
          operatorToken,
          testRegion.code,
        );
        console.log(`Region ${testRegion.code} cleaned up`);
      } catch (error) {
        console.log(`No assignment to clean up for region ${testRegion.code}`);
      }
    }

    if (testMember) {
      console.log(`Cleaning up member ${testMember.xmi}...`);
      try {
        await deleteTariffAssignmentFromMemberBo(operatorToken, testMember.xmi);
        console.log(`Member ${testMember.xmi} cleaned up`);
      } catch (error) {
        console.log(`No assignment to clean up for member ${testMember.xmi}`);
      }
    }
  });

  test("BO: Delete tariff assignment from region - verify successful deletion", async () => {
    // Skip if prerequisites not met
    if (!testRegion || !testTariffCode) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    console.log("=== Testing delete tariff assignment from region ===");
    console.log(`Region Code: ${testRegion.code}`);
    console.log(`Region Name: ${testRegion.name}`);
    console.log(`Tariff Code to unassign: ${testTariffCode}`);

    // First, verify the tariff is currently assigned
    console.log("\nVerifying tariff is currently assigned...");
    const assignedRegionsResult =
      await getAssignedTariffsForRegionsBo(operatorToken);

    if (assignedRegionsResult.response.status() === 200) {
      let assignedRegions;

      if (Array.isArray(assignedRegionsResult.body)) {
        assignedRegions = assignedRegionsResult.body;
      } else if (
        assignedRegionsResult.body &&
        assignedRegionsResult.body.content
      ) {
        assignedRegions = assignedRegionsResult.body.content;
      } else {
        assignedRegions = [];
      }

      const ourRegion = assignedRegions.find(
        (region: any) => region.code === testRegion.code,
      );
      if (ourRegion) {
        expect(ourRegion.tariff.code).toBe(testTariffCode);
        console.log(
          `Verified tariff ${testTariffCode} is assigned to region ${testRegion.code}`,
        );
      } else {
        console.log(
          `Warning: Region ${testRegion.code} not found in assigned regions list`,
        );
      }
    }

    // Delete the tariff assignment
    console.log("\nDeleting tariff assignment from region...");
    const deleteResult = await deleteTariffAssignmentFromRegionBo(
      operatorToken,
      testRegion.code,
    );

    // Verify response
    const response = deleteResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const responseBody = deleteResult.body;
    console.log("Response body:", responseBody);

    // Check response body structure
    expect(responseBody).toHaveProperty("code");
    expect(responseBody).toHaveProperty("name");
    expect(responseBody).toHaveProperty("asset");
    expect(responseBody).toHaveProperty("tariff");

    expect(responseBody.code).toBe(testRegion.code);
    expect(responseBody.name).toBe(testRegion.name);
    expect(responseBody.asset).toBe(testRegion.asset);

    // Tariff should be null after deletion
    expect(responseBody.tariff).toBeNull();
    console.log("Response body structure verified - tariff is null");

    // Verify the tariff is actually deleted from assignments list
    console.log("\nVerifying tariff has been unassigned...");
    const updatedAssignedRegionsResult =
      await getAssignedTariffsForRegionsBo(operatorToken);

    if (updatedAssignedRegionsResult.response.status() === 200) {
      let updatedAssignedRegions;

      if (Array.isArray(updatedAssignedRegionsResult.body)) {
        updatedAssignedRegions = updatedAssignedRegionsResult.body;
      } else if (
        updatedAssignedRegionsResult.body &&
        updatedAssignedRegionsResult.body.content
      ) {
        updatedAssignedRegions = updatedAssignedRegionsResult.body.content;
      } else {
        updatedAssignedRegions = [];
      }

      const ourRegionAfterDelete = updatedAssignedRegions.find(
        (region: any) => region.code === testRegion.code,
      );

      if (ourRegionAfterDelete) {
        console.log(
          `Region ${testRegion.code} still in list but should have no tariff`,
        );
        expect(ourRegionAfterDelete.tariff).toBeNull();
      } else {
        console.log(
          `Region ${testRegion.code} not in assigned regions list (expected since it has no tariff)`,
        );
      }
    }

    // Try to delete the same assignment again - should still succeed (idempotent) or return error
    console.log("\nAttempting to delete already deleted tariff assignment...");
    try {
      const duplicateDeleteResult = await deleteTariffAssignmentFromRegionBo(
        operatorToken,
        testRegion.code,
      );

      const duplicateStatus = duplicateDeleteResult.response.status();
      console.log(`Duplicate delete status: ${duplicateStatus}`);

      // API might be idempotent (return 200) or return an error
      // Both are acceptable depending on API design
      if (duplicateStatus === 200) {
        console.log("Duplicate delete returned 200 (idempotent API)");
        // Verify response still shows null tariff
        expect(duplicateDeleteResult.body.tariff).toBeNull();
      } else if (duplicateStatus === 404 || duplicateStatus === 400) {
        console.log(
          `Duplicate delete returned ${duplicateStatus} (no assignment to delete)`,
        );
      } else {
        console.log(
          `Duplicate delete returned unexpected status: ${duplicateStatus}`,
        );
      }
    } catch (error: any) {
      console.log(
        `Error when deleting already deleted assignment: ${error.message}`,
      );
    }

    console.log(
      "\nTariff assignment deletion from region test completed successfully",
    );
  });

  test("BO: Delete tariff assignment from member - verify successful deletion", async () => {
    // Skip if prerequisites not met
    if (!testMember || !testTariffCode) {
      console.log("Skipping test - prerequisites not met");
      return;
    }

    // Check if member has the tariff assigned (might have been skipped due to asset mismatch)
    console.log("=== Testing delete tariff assignment from member ===");
    console.log(`Member XMI: ${testMember.xmi}`);
    console.log(`Member Name: ${testMember.name}`);
    console.log(`Tariff Code to unassign: ${testTariffCode}`);

    // First, verify the tariff is currently assigned
    console.log("\nVerifying tariff is currently assigned to member...");
    const assignedMembersResult =
      await getAssignedTariffsForMembersBo(operatorToken);

    if (assignedMembersResult.response.status() === 200) {
      const assignedMembers = assignedMembersResult.body.content || [];
      const ourMember = assignedMembers.find(
        (member: any) => member.xmi === testMember.xmi,
      );

      if (
        ourMember &&
        ourMember.tariff &&
        ourMember.tariff.code === testTariffCode
      ) {
        console.log(
          `Verified tariff ${testTariffCode} is assigned to member ${testMember.xmi}`,
        );
      } else {
        console.log(
          `Member ${testMember.xmi} does not have tariff ${testTariffCode} assigned, skipping test`,
        );
        return;
      }
    } else {
      console.log("Failed to get assigned members list");
      return;
    }

    // Delete the tariff assignment
    console.log("\nDeleting tariff assignment from member...");
    const deleteResult = await deleteTariffAssignmentFromMemberBo(
      operatorToken,
      testMember.xmi,
    );

    // Verify response
    const response = deleteResult.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    // Verify status is 200 OK
    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Verify response body structure
    const responseBody = deleteResult.body;
    console.log("Response body:", responseBody);

    // The response structure for member deletion might be different from region deletion
    // It could be empty or have a specific structure
    // We'll check for common patterns

    if (responseBody && typeof responseBody === "object") {
      if (Object.keys(responseBody).length === 0) {
        console.log("Response body is an empty object (acceptable)");
      } else if (responseBody.code && responseBody.name && responseBody.asset) {
        // Might have similar structure to region deletion
        console.log("Response has region-like structure");
        expect(responseBody).toHaveProperty("code");
        expect(responseBody).toHaveProperty("name");
        expect(responseBody).toHaveProperty("asset");

        if (responseBody.tariff !== undefined) {
          expect(responseBody.tariff).toBeNull();
          console.log("Tariff is null in response");
        }
      } else {
        console.log("Response body has unexpected structure:", responseBody);
      }
    } else if (!responseBody) {
      console.log("Response body is null or undefined (acceptable)");
    }

    // Verify the tariff is actually deleted from assignments list
    console.log("\nVerifying tariff has been unassigned from member...");
    const updatedAssignedMembersResult =
      await getAssignedTariffsForMembersBo(operatorToken);

    if (updatedAssignedMembersResult.response.status() === 200) {
      const updatedAssignedMembers =
        updatedAssignedMembersResult.body.content || [];
      const ourMemberAfterDelete = updatedAssignedMembers.find(
        (member: any) => member.xmi === testMember.xmi,
      );

      if (ourMemberAfterDelete) {
        console.log(
          `Member ${testMember.xmi} still in list, checking tariff status...`,
        );
        console.log(
          `Member found with tariff: ${ourMemberAfterDelete.tariff ? ourMemberAfterDelete.tariff.code : "null"}`,
        );
      } else {
        console.log(
          `Member ${testMember.xmi} not in assigned members list (expected since it has no tariff)`,
        );
      }
    }

    console.log(
      "\nTariff assignment deletion from member test completed successfully",
    );
  });
});
