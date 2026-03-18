import { expect, test } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { SettlementAssetTypes } from "../../../../consts/clearing/settlementAssetTypes";

import { AddDirectAssetPayload } from "../../../../modules/clearing/addDirectAssetPayload";
import { cleanupAsset } from "@utils/clearingService/settlementProfile/cleanupAsset";
import { getMemberSettlementAssets } from "@utils/clearingService/settlementProfile/getMemberSettlementAssets";
import { getAllowedAssets } from "@utils/clearingService/settlementProfile/getAllowedAssets";
import { getCustodianDirect } from "@utils/clearingService/settlementProfile/getCustodianDirect";
import { addDirectAsset } from "@utils/clearingService/settlementProfile/addAssetDirect";

test.describe("Add Direct Asset for Member", () => {
  let operatorToken: string;
  const memberXmi = config.setMemberXmi;

  // Declare variables that need to be shared between test and afterAll
  let assetCodeToCleanup: string = "";
  let assetWasAdded: boolean = false;

  test.beforeAll(async () => {
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test.afterAll(async () => {
    // Use the reusable cleanup function for single asset
    await cleanupAsset({
      operatorToken,
      memberXmi,
      assetCode: assetCodeToCleanup,
      wasAdded: assetWasAdded,
      assetDescription: "network asset",
    });
  });

  test("should add direct asset successfully and verify it exists", async () => {
    // Reset cleanup state for this test
    assetCodeToCleanup = "";
    assetWasAdded = false;

    // Step 1: Get current member settlement assets
    const currentAssets = await getMemberSettlementAssets(
      operatorToken,
      memberXmi,
    );
    const currentAssetCodes = currentAssets.map((asset) => asset.asset.code);

    // Step 2: Get allowed assets for the member
    const allowedAssets = await getAllowedAssets(operatorToken, memberXmi);

    // Find an asset that is allowed but not currently configured
    const fiatAssets = allowedAssets.filter((asset) => asset.type === "fiat");
    const assetToAdd = fiatAssets.find(
      (asset) => !currentAssetCodes.includes(asset.code),
    );
    console.log(assetToAdd);
    if (!assetToAdd) {
      test.skip();
      return;
    }

    // In Step 3: Get available custodians for the selected asset
    const custodians = await getCustodianDirect(
      operatorToken,
      memberXmi,
      assetToAdd.code,
    );

    if (custodians.length === 0) {
      test.skip();
      return;
    }

    const selectedCustodian = custodians[0];

    // Step 4: Prepare and send add asset request
    const assetPayload: AddDirectAssetPayload = {
      asset: assetToAdd.code,
      custodian_xmi: selectedCustodian.member.xmi, // This should be the custodian's XMI, not member's
      account_number: "CD111111111111111111111111111111",
      external_account_number: "CD111111111111111111111111111111",
    };

    const addResponse = await addDirectAsset(
      operatorToken,
      memberXmi,
      assetPayload,
    );
    console.log(addResponse);

    // Assert that asset was added successfully
    expect(addResponse.response.status()).toBe(200);

    // Set cleanup variables since asset was successfully added
    assetCodeToCleanup = assetToAdd.code;
    assetWasAdded = true;

    // Step 5: Verify the asset was added by checking the updated list
    const updatedAssets = await getMemberSettlementAssets(
      operatorToken,
      memberXmi,
    );
    const addedAsset = updatedAssets.find(
      (asset) => asset.asset.code === assetToAdd.code,
    );
    console.log(updatedAssets);

    // Assert the asset exists in the list
    expect(addedAsset).toBeDefined();
    expect(addedAsset?.asset.code).toBe(assetToAdd.code);
    expect(addedAsset?.asset.name).toBe(assetToAdd.name);
    expect(addedAsset?.settlement_asset_type).toBe(SettlementAssetTypes.direct);
    expect(addedAsset?.parent).toBeDefined();
    expect(addedAsset?.settlement_system?.code).toBe(
      selectedCustodian.settlement_system.code,
    );
    expect(addedAsset?.external_account_number).toBe(
      assetPayload.external_account_number,
    );
    expect(addedAsset?.domestic).toBe(false);
  });
});
