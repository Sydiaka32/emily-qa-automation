import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { getMemberSettlementProfilesBo } from "@utils/clearingService/settlementProfile/bo/getMemberSettlementProfilesBo";
import { getMemberSettlementAssetsBo } from "@utils/clearingService/settlementProfile/bo/getMemberSettlementAssetsBo";
import { getMemberAssetDetailsBo } from "@utils/clearingService/settlementProfile/bo/getMemberAssetDetailsBo";
import { verifyAssetDetails } from "@utils/clearingService/settlementProfile/verifyAssetDetails";

test.describe("BackOffice - Member Asset Details", () => {
  let operatorToken: string;
  let testXmi: string = "";
  let testMemberName: string = "";
  let testAssetCode: string = "";
  let testAssetName: string = "";

  test.beforeAll(async () => {
    // Get operator token for BO operations
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Find a member with settlement assets to use for testing
    console.log("\nFinding a member with settlement assets...");
    const profilesResponse = await getMemberSettlementProfilesBo(
      operatorToken,
      0,
      10,
    );

    expect(profilesResponse.content).toBeDefined();
    expect(profilesResponse.content.length).toBeGreaterThan(0);

    let foundMember = null;
    let foundAsset = null;

    // Try to find a member with settlement assets
    for (const member of profilesResponse.content) {
      try {
        const assets = await getMemberSettlementAssetsBo(
          operatorToken,
          member.xmi,
        );
        if (assets && assets.length > 0) {
          foundMember = member;
          // Pick the first asset that has an account number (more interesting for testing)
          foundAsset =
            assets.find((a) => a.account_number !== null) || assets[0];
          console.log(
            `Found member ${member.xmi} with ${assets.length} settlement assets`,
          );
          break;
        }
      } catch (error: any) {
        // Skip members that fail
        console.log(`Member ${member.xmi} failed: ${error.message}`);
      }
    }

    if (!foundMember || !foundAsset) {
      throw new Error(
        "Could not find a member with settlement assets for testing",
      );
    }

    testXmi = foundMember.xmi;
    testMemberName = foundMember.name;
    testAssetCode = foundAsset.asset.code;
    testAssetName = foundAsset.asset.name;

    console.log(`Selected member: ${testXmi} (${testMemberName})`);
    console.log(`Selected asset: ${testAssetCode} (${testAssetName})`);
  });

  test("BO: Get specific asset details for a member successfully", async () => {
    console.log("=== Testing BO member-specific asset details retrieval ===");
    console.log(`Member: ${testXmi} (${testMemberName})`);
    console.log(`Asset: ${testAssetCode} (${testAssetName})`);

    // Get specific asset details for the member
    console.log(`Fetching ${testAssetCode} details for ${testXmi}...`);
    const assetDetails = await getMemberAssetDetailsBo(
      operatorToken,
      testXmi,
      testAssetCode,
    );

    // Verify the response structure
    console.log("\n=== Response Structure Validation ===");
    verifyAssetDetails(assetDetails, testAssetCode);

    // Additional member-specific validations
    console.log("\n=== Member-Specific Validations ===");

    // Verify the asset code matches
    expect(assetDetails.asset.code).toBe(testAssetCode);
    console.log(`Asset code matches: ${assetDetails.asset.code}`);

    // Verify the asset name matches
    expect(assetDetails.asset.name).toBe(testAssetName);
    console.log(`Asset name matches: ${assetDetails.asset.name}`);

    // Verify custodian exists
    expect(assetDetails.custodian).toBeDefined();
    expect(assetDetails.custodian!.xmi).toBeDefined();
    expect(assetDetails.custodian!.name).toBeDefined();
    console.log(
      `Custodian: ${assetDetails.custodian!.name} (${assetDetails.custodian!.xmi})`,
    );

    // Verify settlement system exists
    expect(assetDetails.settlement_system).toBeDefined();
    expect(assetDetails.settlement_system!.code).toBeDefined();
    expect(assetDetails.settlement_system!.name).toBeDefined();
    console.log(
      `Settlement System: ${assetDetails.settlement_system!.name} (${assetDetails.settlement_system!.code})`,
    );

    // Verify domestic flag
    expect(typeof assetDetails.domestic).toBe("boolean");
    console.log(`Domestic flag: ${assetDetails.domestic}`);

    // Verify settlement asset type
    expect(assetDetails.settlement_asset_type).toBeDefined();
    console.log(`Settlement Asset Type: ${assetDetails.settlement_asset_type}`);

    // Check account numbers
    if (assetDetails.account_number) {
      console.log(
        `Account Number: ${assetDetails.account_number.substring(0, 20)}...`,
      );
    }

    if (assetDetails.external_account_number) {
      console.log(
        `External Account Number: ${assetDetails.external_account_number.substring(0, 20)}...`,
      );
    }

    console.log(
      "\nBO member-specific asset details test completed successfully",
    );
  });
});
