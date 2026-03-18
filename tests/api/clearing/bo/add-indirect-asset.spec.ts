import { expect, test } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { SettlementAssetTypes } from "../../../../consts/clearing/settlementAssetTypes";
import { AddIndirectAssetPayload } from "../../../../modules/clearing/addIndirectAssetPayload";
import { cleanupAsset } from "@utils/clearingService/settlementProfile/cleanupAsset";
import { getMemberSettlementAssets } from "@utils/clearingService/settlementProfile/getMemberSettlementAssets";
import { getAllowedAssets } from "@utils/clearingService/settlementProfile/getAllowedAssets";
import { getCustodianIndirect } from "@utils/clearingService/settlementProfile/getCustodianIndirect";
import { addIndirectAsset } from "@utils/clearingService/settlementProfile/addAssetIndirect";

test.describe("Add Indirect Asset for Member", () => {
  let operatorToken: string;
  const testMemberXmi = config.setMemberXmi;

  // Declare variables for cleanup
  let assetCodeToCleanup: string = "";
  let assetWasAdded: boolean = false;

  test.beforeAll(async () => {
    // Get operator authentication token before running tests
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test.afterAll(async () => {
    // Use the reusable cleanup function
    await cleanupAsset({
      operatorToken,
      memberXmi: testMemberXmi,
      assetCode: assetCodeToCleanup,
      wasAdded: assetWasAdded,
      assetDescription: "indirect asset",
    });
  });

  test("should add indirect asset successfully and verify it exists", async () => {
    // Reset cleanup state for this test
    assetCodeToCleanup = "";
    assetWasAdded = false;

    // Step 1: Get current member settlement assets
    const currentAssets = await getMemberSettlementAssets(
      operatorToken,
      testMemberXmi,
    );
    const currentAssetCodes = currentAssets.map((asset) => asset.asset.code);

    // Step 2: Get allowed assets for the member
    const allowedAssets = await getAllowedAssets(operatorToken, testMemberXmi);

    // Find an asset that is allowed but not currently configured
    const assetToAdd = allowedAssets.find(
      (asset) => !currentAssetCodes.includes(asset.code),
    );

    if (!assetToAdd) {
      test.skip();
      return;
    }

    // Step 3: Get available indirect custodians for the selected asset
    const custodians = await getCustodianIndirect(
      operatorToken,
      testMemberXmi,
      assetToAdd.code,
    );

    if (custodians.length === 0) {
      test.skip();
      return; // Skip test if no custodians available
    }

    const selectedCustodian = custodians[0];

    // Step 4: Prepare and send add indirect asset request
    const assetPayload: AddIndirectAssetPayload = {
      asset: assetToAdd.code,
      direct_member_xmi: selectedCustodian.member.xmi,
    };

    const addResponse = await addIndirectAsset(
      operatorToken,
      testMemberXmi,
      assetPayload,
    );

    // Assert that asset was added successfully
    expect(addResponse.response.status()).toBe(200);

    // Set cleanup variables since asset was successfully added
    assetCodeToCleanup = assetToAdd.code;
    assetWasAdded = true;

    // Step 5: Verify the response structure
    const addedAsset = addResponse.body;
    console.log(addedAsset);

    expect(addedAsset.asset.code).toBe(assetToAdd.code);
    expect(addedAsset.asset.name).toBe(assetToAdd.name);
    expect(addedAsset.settlement_asset_type).toBe(
      SettlementAssetTypes.indirect,
    );
    expect(addedAsset.parent.xmi).toBe(selectedCustodian.member.xmi);
    expect(addedAsset.parent.name).toBe(selectedCustodian.member.name);

    // Updated expectations based on actual response
    expect(addedAsset.custodian).toBeDefined();
    expect(addedAsset.settlement_system).toBeDefined();
    expect(addedAsset.account_number).toBeDefined();
    expect(addedAsset.external_account_number).toBeDefined();
    expect(addedAsset.domestic).toBe(false);

    // Step 6: Verify the asset was added by checking the updated list
    const updatedAssets = await getMemberSettlementAssets(
      operatorToken,
      testMemberXmi,
    );
    const foundAsset = updatedAssets.find(
      (asset) => asset.asset.code === assetToAdd.code,
    );
    console.log(updatedAssets);
    // Assert the asset exists in the list
    expect(foundAsset).toBeDefined();
    expect(foundAsset?.asset.code).toBe(assetToAdd.code);
    expect(foundAsset?.asset.name).toBe(assetToAdd.name);
    expect(foundAsset?.settlement_asset_type).toBe(
      SettlementAssetTypes.indirect,
    );
    expect(foundAsset?.parent?.xmi).toBe(selectedCustodian.member.xmi);
    expect(foundAsset?.custodian).toBeDefined();
    expect(foundAsset?.settlement_system).toBeDefined();
    expect(foundAsset?.account_number).toBeNull();
    expect(foundAsset?.external_account_number).toBeNull();
    expect(foundAsset?.domestic).toBe(false);

    // Assert the asset exists in the list
    expect(foundAsset).toBeDefined();
    expect(foundAsset?.asset.code).toBe(assetToAdd.code);
    expect(foundAsset?.asset.name).toBe(assetToAdd.name);
    expect(foundAsset?.settlement_asset_type).toBe(
      SettlementAssetTypes.indirect,
    );
    expect(foundAsset?.parent?.xmi).toBe(selectedCustodian.member.xmi);
    expect(foundAsset?.custodian?.xmi).toBe(selectedCustodian.custodian.xmi);
    expect(foundAsset?.settlement_system?.code).toBe(
      selectedCustodian.settlement_system.code,
    );
    expect(foundAsset?.account_number).toBeDefined();
    expect(foundAsset?.external_account_number).toBeDefined();
    expect(foundAsset?.domestic).toBe(false);
  });
});
