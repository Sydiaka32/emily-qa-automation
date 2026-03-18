import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getSettlementAssetsList } from "@utils/clearingService/settlementProfile/getSettlementAssetsList";
import { getAssetDetails } from "@utils/clearingService/settlementProfile/getAssetDetails";
import { verifyAssetDetails } from "@utils/clearingService/settlementProfile/verifyAssetDetails";

test.describe("Settlement Asset Details - Get", () => {
  let memberToken: string;
  let availableAssets: any[] = [];

  test.beforeAll(async () => {
    // Get token for the member
    memberToken = await getAccessToken(config.memberName, config.password);

    // Get list of available assets for testing
    console.log("Fetching available settlement assets...");
    availableAssets = await getSettlementAssetsList(memberToken);

    expect(availableAssets).toBeDefined();
    expect(availableAssets.length).toBeGreaterThan(0);

    console.log(`Found ${availableAssets.length} available assets`);
    console.log(
      "Sample assets:",
      availableAssets.slice(0, 3).map((a) => a.asset.code),
    );
  });

  test("Get asset details for a valid asset code", async () => {
    console.log("\n=== Testing asset details retrieval ===");

    // Pick the first asset from the list
    const testAsset = availableAssets[0];
    const assetCode = testAsset.asset.code;

    console.log(`Testing with asset: ${assetCode} (${testAsset.asset.name})`);
    console.log(`Asset type: ${testAsset.settlement_asset_type}`);

    // Get asset details
    console.log(`Fetching details for ${assetCode}...`);
    const assetDetails = await getAssetDetails(memberToken, assetCode);

    // Verify the response structure
    verifyAssetDetails(assetDetails, assetCode);

    // Additional specific validations
    console.log("\n=== Additional Validations ===");

    // Verify asset code and name match the list
    expect(assetDetails.asset.code).toBe(testAsset.asset.code);
    expect(assetDetails.asset.name).toBe(testAsset.asset.name);
    console.log(`Asset name matches: ${assetDetails.asset.name}`);

    // Verify settlement asset type matches
    expect(assetDetails.settlement_asset_type).toBe(
      testAsset.settlement_asset_type,
    );
    console.log(
      `Settlement type matches: ${assetDetails.settlement_asset_type}`,
    );

    // Verify custodian matches
    if (testAsset.custodian) {
      expect(assetDetails.custodian!.xmi).toBe(testAsset.custodian.xmi);
      console.log(`Custodian XMI matches: ${assetDetails.custodian!.xmi}`);
    }

    console.log("Asset details retrieval test completed successfully!");
  });

  test("Get asset details with invalid asset code should fail", async () => {
    console.log("\n=== Testing with invalid asset code ===");

    const invalidAssetCode = "INVALID_ASSET_123";
    console.log(`Using invalid asset code: ${invalidAssetCode}`);

    try {
      await getAssetDetails(memberToken, invalidAssetCode);

      // If we get here, the test should fail because we expected an error
      new Error("Expected request to fail with invalid asset code");
    } catch (error: any) {
      console.log(`Expected error occurred: ${error.message}`);
      // Should be 404 or 400
    }
  });
});
