import { expect, test } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { AddNoneAssetPayload } from "../../../../modules/clearing/addNoneAssetPayload";
import { cleanupAsset } from "@utils/clearingService/settlementProfile/cleanupAsset";
import { getMemberSettlementAssets } from "@utils/clearingService/settlementProfile/getMemberSettlementAssets";
import { getAllowedAssets } from "@utils/clearingService/settlementProfile/getAllowedAssets";
import { SettlementAssetTypes } from "../../../../consts/clearing/settlementAssetTypes";
import { addNoneAsset } from "@utils/clearingService/settlementProfile/addAssetNone";
import { getCustodianNone } from "@utils/clearingService/settlementProfile/getCustodianNone";

test.describe("Add None Asset for Member", () => {
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
      assetDescription: "none asset",
    });
  });

  test("should add none asset successfully and verify it exists", async () => {
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

    // UPDATED STEP: Get the entire custodian response array
    const custodianResponses = await getCustodianNone(
      operatorToken,
      testMemberXmi,
      assetToAdd.code,
    );

    // Extract the member XMI from the first response in the array
    const custodianXmi = custodianResponses[0].member.xmi;

    // Step 3: Prepare and send add none asset request
    const assetPayload: AddNoneAssetPayload = {
      asset: assetToAdd.code,
      custodian_xmi: custodianXmi,
    };

    const addResponse = await addNoneAsset(
      operatorToken,
      testMemberXmi,
      assetPayload,
    );

    console.log(addResponse);

    // Assert that asset was added successfully
    expect(addResponse.response.status()).toBe(200);

    // Set cleanup variables since asset was successfully added
    assetCodeToCleanup = assetToAdd.code;
    assetWasAdded = true;

    // Step 5: Verify the response structure matches the expected format
    const addedAsset = addResponse.body;
    console.log(addedAsset);

    expect(addedAsset.asset.code).toBe(assetToAdd.code);
    expect(addedAsset.asset.name).toBe(assetToAdd.name);
    expect(addedAsset.settlement_asset_type).toBe(SettlementAssetTypes.none);
    expect(addedAsset.parent).toBeNull();

    // Updated expectations - custodian should NOT be null
    expect(addedAsset.custodian).toBeDefined();

    // Settlement system should NOT be null
    expect(addedAsset.settlement_system).toBeDefined();
    expect(addedAsset.settlement_system.code).toBeDefined();
    expect(addedAsset.settlement_system.name).toBeDefined();
    expect(addedAsset.settlement_system.rtgs_support).toBeDefined();
    expect(addedAsset.settlement_system.adapter).toBeDefined();

    expect(addedAsset.account_number).toBeNull();
    expect(addedAsset.external_account_number).toBeNull();
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

    // Assert the asset exists in the list with correct properties
    expect(foundAsset).toBeDefined();
    expect(foundAsset?.asset.code).toBe(assetToAdd.code);
    expect(foundAsset?.asset.name).toBe(assetToAdd.name);
    expect(foundAsset?.settlement_asset_type).toBe(SettlementAssetTypes.none);
    expect(foundAsset?.parent).toBeNull();

    // Updated expectations for the found asset
    expect(foundAsset?.custodian).toBeDefined();
    expect(foundAsset?.custodian?.xmi).toBe(custodianXmi);
    expect(foundAsset?.custodian?.name).toBeDefined();

    expect(foundAsset?.settlement_system).toBeDefined();
    expect(foundAsset?.settlement_system?.code).toBeDefined();
    expect(foundAsset?.settlement_system?.name).toBeDefined();
    expect(foundAsset?.settlement_system?.rtgs_support).toBeDefined();
    expect(foundAsset?.settlement_system?.adapter).toBeDefined();

    expect(foundAsset?.account_number).toBeNull();
    expect(foundAsset?.external_account_number).toBeNull();
    expect(foundAsset?.domestic).toBe(false);
  });
});
