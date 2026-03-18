import { test, expect } from "@playwright/test";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getSettlementAssetsList } from "@utils/clearingService/settlementProfile/getSettlementAssetsList";
import { ensureNoneAsset } from "@utils/clearingService/settlementProfile/ensureNoneAsset";
import { cleanupAsset } from "@utils/clearingService/settlementProfile/cleanupAsset";

test.describe("GET /api/v1/settlement/profiles", () => {
  let authToken: string;
  let operatorToken: string;

  // Declare variables for cleanup
  let assetCodeToCleanup: string = "";
  let assetWasAdded: boolean = false;

  test.beforeAll(async () => {
    // Get authentication tokens before running tests
    authToken = await getAccessToken(config.memberName, config.password);
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // Ensure member has at least one settlement asset before running tests
    const result = await ensureNoneAsset();

    if (!result.success) {
      throw new Error(
        `Failed to ensure settlement asset exists: ${result.message}`,
      );
    }

    // Set cleanup variables if an asset was actually added
    if (result.assetCode) {
      assetCodeToCleanup = result.assetCode;
      assetWasAdded = true;
    }
  });

  test.afterAll(async () => {
    // Clean up the asset if it was added during the test
    await cleanupAsset({
      operatorToken,
      memberXmi: config.setMemberXmi,
      assetCode: assetCodeToCleanup,
      wasAdded: assetWasAdded,
      assetDescription: "test settlement asset",
    });
  });

  test("should get settlement assets successfully with 200 status", async () => {
    // Act
    const settlementAssets = await getSettlementAssetsList(authToken);

    // Assert
    expect(settlementAssets).toBeDefined();
    expect(Array.isArray(settlementAssets)).toBe(true);
    expect(settlementAssets.length).toBeGreaterThan(0);

    // Assert
    const firstAsset = settlementAssets[0];

    // Check main structure
    expect(firstAsset).toHaveProperty("asset");
    expect(firstAsset).toHaveProperty("settlement_asset_type");
    expect(firstAsset).toHaveProperty("parent");
    expect(firstAsset).toHaveProperty("custodian");
    expect(firstAsset).toHaveProperty("settlement_system");
    expect(firstAsset).toHaveProperty("account_number");
    expect(firstAsset).toHaveProperty("external_account_number");
    expect(firstAsset).toHaveProperty("domestic");

    // Check asset nested structure
    expect(firstAsset.asset).toHaveProperty("code");
    expect(firstAsset.asset).toHaveProperty("name");
  });
});
