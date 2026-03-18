import { expect, test } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { SettlementAssetTypes } from "../../../../consts/clearing/settlementAssetTypes";
import { AddNetworkAssetPayload } from "../../../../modules/clearing/addNetworkAssetPayload";
import { cleanupAsset } from "@utils/clearingService/settlementProfile/cleanupAsset";
import { getMemberSettlementAssets } from "@utils/clearingService/settlementProfile/getMemberSettlementAssets";
import { getCustodianNetwork } from "@utils/clearingService/settlementProfile/getCustodianNetwork";
import { addAssetNetwork } from "@utils/clearingService/settlementProfile/addAssetNetwork";

test.describe("Add Network Asset for Member", () => {
  let operatorToken: string;
  const memberXmi = config.setMemberXmi;
  const networkAsset = config.networkAsset;

  // Declare variables for cleanup
  let assetWasAdded: boolean = false;

  test.beforeAll(async () => {
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test.afterAll(async () => {
    await cleanupAsset({
      operatorToken,
      memberXmi,
      assetCode: networkAsset || "",
      wasAdded: assetWasAdded,
      assetDescription: "network asset",
    });
  });

  test("should add network asset successfully and verify it exists", async () => {
    // Reset cleanup state for this test
    assetWasAdded = false;

    // Validate that network asset is configured
    if (!networkAsset) {
      test.fail(true, "NETWORK_ASSET is not configured in test.config.ts");
      return;
    }

    console.log(
      `Using network asset: ${networkAsset} for member: ${memberXmi}`,
    );

    // Step 1: Get current member settlement assets to ensure the network asset isn't already configured
    const currentAssets = await getMemberSettlementAssets(
      operatorToken,
      memberXmi,
    );
    const currentAssetCodes = currentAssets.map((asset) => asset.asset.code);

    // Check if the network asset is already configured for this member
    if (currentAssetCodes.includes(networkAsset)) {
      console.log(
        `Network asset ${networkAsset} is already configured for member ${memberXmi}. Test will be skipped.`,
      );
      test.skip();
      return;
    }

    // Step 2: Get available network custodians for the network asset
    const custodians = await getCustodianNetwork(
      operatorToken,
      memberXmi,
      networkAsset,
    );

    if (custodians.length === 0) {
      console.log(
        `No network custodians available for asset ${networkAsset}. Test will be skipped.`,
      );
      test.skip();
      return;
    }

    const selectedCustodian = custodians[0];
    console.log(
      `Selected custodian: ${selectedCustodian.member.xmi} (${selectedCustodian.member.name})`,
    );

    // Step 3: Prepare and send add network asset request
    const assetPayload: AddNetworkAssetPayload = {
      asset: networkAsset,
      asset_type: SettlementAssetTypes.network,
      custodian_xmi: selectedCustodian.member.xmi,
      account_number: "CD111111111111111111111111111111",
      external_account_number: "CD111111111111111111111111111111",
    };

    const addResponse = await addAssetNetwork(
      operatorToken,
      memberXmi,
      assetPayload,
    );
    console.log(addResponse);
    // Assert that asset was added successfully
    expect(addResponse.response.status()).toBe(200);

    assetWasAdded = true;

    // Step 4: Verify the response structure
    const addedAsset = addResponse.body;

    expect(addedAsset.asset.code).toBe(networkAsset);
    expect(addedAsset.settlement_asset_type).toBe(SettlementAssetTypes.network);
    expect(addedAsset.parent).toBeNull();
    expect(addedAsset.custodian.xmi).toBe(selectedCustodian.member.xmi);
    expect(addedAsset.custodian.name).toBe(selectedCustodian.member.name);
    expect(addedAsset.settlement_system.code).toBe(
      selectedCustodian.settlement_system.code,
    );
    expect(addedAsset.account_number).toBe(addedAsset.account_number);
    expect(addedAsset.external_account_number).toBe(
      addedAsset.external_account_number,
    );
    expect(addedAsset.domestic).toBe(false);

    // Step 5: Verify the asset was added by checking the updated list
    const updatedAssets = await getMemberSettlementAssets(
      operatorToken,
      memberXmi,
    );
    const foundAsset = updatedAssets.find(
      (asset) => asset.asset.code === networkAsset,
    );
    console.log(updatedAssets);
    // Assert the asset exists in the list
    expect(foundAsset).toBeDefined();
    expect(foundAsset?.asset.code).toBe(networkAsset);
    expect(foundAsset?.settlement_asset_type).toBe(
      SettlementAssetTypes.network,
    );
    expect(foundAsset?.parent).toBeNull();
    expect(foundAsset?.custodian?.xmi).toBe(selectedCustodian.member.xmi);
    expect(foundAsset?.settlement_system?.code).toBe(
      selectedCustodian.settlement_system.code,
    );
    expect(foundAsset?.account_number).toBe(addedAsset.account_number);
    expect(foundAsset?.external_account_number).toBe(
      addedAsset.external_account_number,
    );
    expect(foundAsset?.domestic).toBe(false);
  });
});
