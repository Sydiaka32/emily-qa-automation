import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { getMemberSettlementProfilesBo } from "@utils/clearingService/settlementProfile/bo/getMemberSettlementProfilesBo";
import { getMemberSettlementAssetsBo } from "@utils/clearingService/settlementProfile/bo/getMemberSettlementAssetsBo";
import { verifyMemberSettlementAssets } from "@utils/clearingService/settlementProfile/bo/verifyMemberSettlementAssets";

test.describe("BackOffice - Member Settlement Assets", () => {
  let operatorToken: string;
  let testXmi: string = "";
  let testMemberName: string = "";

  test.beforeAll(async () => {
    // Get operator token for BO operations
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Get member settlement profiles to find a member with settlement assets
    console.log("\nFinding a member with settlement assets...");
    const profilesResponse = await getMemberSettlementProfilesBo(
      operatorToken,
      0,
      10,
    );

    expect(profilesResponse.content).toBeDefined();
    expect(profilesResponse.content.length).toBeGreaterThan(0);

    // Try to find a member with settlement assets
    let foundMember = null;

    for (const member of profilesResponse.content) {
      try {
        const assets = await getMemberSettlementAssetsBo(
          operatorToken,
          member.xmi,
        );
        if (assets && assets.length > 0) {
          foundMember = member;
          console.log(
            `Found member ${member.xmi} with ${assets.length} settlement assets`,
          );
          break;
        }
      } catch (error: any) {
        // Skip members that fail or have no assets
        console.log(
          `Member ${member.xmi} has no settlement assets or failed: ${error.message}`,
        );
      }
    }

    if (!foundMember) {
      // If no member with assets found, use the first member
      foundMember = profilesResponse.content[0];
      console.log(
        `No member with settlement assets found, using first member: ${foundMember.xmi}`,
      );
    }

    testXmi = foundMember.xmi;
    testMemberName = foundMember.name;
    console.log(`Selected member: ${testXmi} (${testMemberName})`);
  });

  test("BO: Get settlement assets for a member successfully", async () => {
    console.log("=== Testing BO member settlement assets retrieval ===");
    console.log(`Member: ${testXmi} (${testMemberName})`);

    // Get settlement assets for the member
    console.log(`Fetching settlement assets for ${testXmi}...`);
    const settlementAssets = await getMemberSettlementAssetsBo(
      operatorToken,
      testXmi,
    );

    // Verify response structure
    console.log("\n=== Response Structure Validation ===");
    expect(settlementAssets).toBeDefined();
    expect(Array.isArray(settlementAssets)).toBe(true);

    console.log(`Found ${settlementAssets.length} settlement assets`);

    if (settlementAssets.length === 0) {
      console.log("No settlement assets found for this member");
      return;
    }

    // Verify settlement assets structure
    verifyMemberSettlementAssets(settlementAssets, testXmi);

    console.log("\nBO member settlement assets test completed successfully");
  });
});
