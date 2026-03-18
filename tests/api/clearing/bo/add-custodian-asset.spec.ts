import { expect, test } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { SettlementAssetTypes } from "../../../../consts/clearing/settlementAssetTypes";
import { AddNetworkAssetPayload } from "../../../../modules/clearing/addNetworkAssetPayload";
import { AddCustodianAssetPayload } from "../../../../modules/clearing/addCustodianAssetPayload";
import { getMemberSettlementAssets } from "@utils/clearingService/settlementProfile/getMemberSettlementAssets";
import { getCustodianNetwork } from "@utils/clearingService/settlementProfile/getCustodianNetwork";
import { addAssetNetwork } from "@utils/clearingService/settlementProfile/addAssetNetwork";
import { cleanupAsset } from "@utils/clearingService/settlementProfile/cleanupAsset";
import { addAssetCustodian } from "@utils/clearingService/settlementProfile/addAssetCustodian";

test.describe("Add Custodian Asset for Member", () => {
  let operatorToken: string;
  const memberXmi = config.setMemberXmi;
  const custodianAsset = config.custodianAsset;

  // Declare variables for cleanup
  let custodianAssetWasAdded: boolean = false;
  let networkAssetWasCreated: boolean = false;

  test.beforeAll(async () => {
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // Validate that custodian asset is configured
    if (!custodianAsset) {
      test.fail(true, "CUSTODIAN_ASSET is not configured in test.config.ts");
      return;
    }

    console.log(
      `Setting up test: Creating network asset for ${custodianAsset} first`,
    );

    // Step 1: Check if network asset already exists
    const currentAssets = await getMemberSettlementAssets(
      operatorToken,
      memberXmi,
    );
    const currentAssetCodes = currentAssets.map((asset) => asset.asset.code);

    // If network asset doesn't exist, create it
    if (!currentAssetCodes.includes(custodianAsset)) {
      console.log(
        `Network asset ${custodianAsset} doesn't exist, creating it...`,
      );

      // Get available network custodians
      const custodians = await getCustodianNetwork(
        operatorToken,
        memberXmi,
        custodianAsset,
      );

      if (custodians.length === 0) {
        console.log(
          `No network custodians available for asset ${custodianAsset}. Test setup failed.`,
        );
        test.fail(
          true,
          `No network custodians available for asset ${custodianAsset}`,
        );
        return;
      }

      const selectedCustodian = custodians[0];

      // Create network asset
      const networkPayload: AddNetworkAssetPayload = {
        asset: custodianAsset,
        asset_type: SettlementAssetTypes.network,
        custodian_xmi: selectedCustodian.member.xmi,
        account_number: "CD111111111111111111111111111111",
        external_account_number: "CD111111111111111111111111111111",
      };

      const networkResponse = await addAssetNetwork(
        operatorToken,
        memberXmi,
        networkPayload,
      );

      if (networkResponse.response.status() === 200) {
        console.log(
          `Successfully created network asset ${custodianAsset} for test setup`,
        );
        networkAssetWasCreated = true;
      } else {
        console.log(
          `Failed to create network asset ${custodianAsset} for test setup`,
        );
        test.fail(true, `Failed to create network asset ${custodianAsset}`);
        return;
      }
    } else {
      console.log(
        `Network asset ${custodianAsset} already exists, proceeding with test`,
      );
    }
  });

  test.afterAll(async () => {
    // Cleanup custodian asset if it was added during the test
    await cleanupAsset({
      operatorToken,
      memberXmi,
      assetCode: custodianAsset,
      wasAdded: custodianAssetWasAdded,
      assetDescription: "custodian asset",
    });

    // Cleanup network asset if it was created during test setup
    await cleanupAsset({
      operatorToken,
      memberXmi,
      assetCode: custodianAsset,
      wasAdded: networkAssetWasCreated,
      assetDescription: "network asset",
    });
  });

  test("should add custodian asset successfully and verify it exists", async () => {
    // Reset test-specific state
    custodianAssetWasAdded = false;

    // Validate that custodian asset is configured
    if (!custodianAsset) {
      test.fail(true, "CUSTODIAN_ASSET is not configured in test.config.ts");
      return;
    }

    console.log(
      `Using custodian asset: ${custodianAsset} for member: ${memberXmi}`,
    );

    // Step 1: Get current member settlement assets to check current state
    const currentAssets = await getMemberSettlementAssets(
      operatorToken,
      memberXmi,
    );

    // Find the existing network asset to get system code
    const existingNetworkAsset = currentAssets.find(
      (asset) =>
        asset.asset.code === custodianAsset &&
        asset.settlement_asset_type === SettlementAssetTypes.network,
    );

    if (!existingNetworkAsset) {
      console.log(
        `Network asset ${custodianAsset} not found for member ${memberXmi}. Test will be skipped.`,
      );
      test.skip();
      return;
    }

    // Get system code from existing network asset
    const systemCode = existingNetworkAsset.settlement_system?.code;
    if (!systemCode) {
      console.log(
        `No settlement system found for network asset ${custodianAsset}. Test will be skipped.`,
      );
      test.skip();
      return;
    }

    console.log(`Using system code: ${systemCode} from existing network asset`);

    // Step 2: Prepare and send add custodian asset request
    const custodianPayload: AddCustodianAssetPayload = {
      asset: custodianAsset,
      account_number: "CD111111111111111111111111111111",
      external_account_number: "CD111111111111111111111111111111",
      system_code: systemCode,
    };

    const addResponse = await addAssetCustodian(
      operatorToken,
      memberXmi,
      custodianPayload,
    );

    console.log(addResponse);

    // Assert that asset was added successfully
    expect(addResponse.response.status()).toBe(200);

    custodianAssetWasAdded = true;

    // Step 3: Verify the response structure
    const addedAsset = addResponse.body;

    expect(addedAsset.asset.code).toBe(custodianAsset);
    expect(addedAsset.settlement_asset_type).toBe(
      SettlementAssetTypes.custodian,
    );
    expect(addedAsset.parent).toBeNull();
    expect(addedAsset.settlement_system.code).toBe(systemCode);
    expect(addedAsset.account_number).toBe(custodianPayload.account_number);
    expect(addedAsset.external_account_number).toBe(
      custodianPayload.external_account_number,
    );
    expect(addedAsset.domestic).toBe(false);

    // Step 4: Verify the asset was added by checking the updated list
    const updatedAssets = await getMemberSettlementAssets(
      operatorToken,
      memberXmi,
    );
    const foundAsset = updatedAssets.find(
      (asset) =>
        asset.asset.code === custodianAsset &&
        asset.settlement_asset_type === SettlementAssetTypes.custodian,
    );

    console.log(updatedAssets);

    // Assert the custodian asset exists in the list
    expect(foundAsset).toBeDefined();
    expect(foundAsset?.asset.code).toBeDefined();
    expect(foundAsset?.settlement_asset_type).toBe(
      SettlementAssetTypes.custodian,
    );
    expect(foundAsset?.parent).toBeNull();
    expect(foundAsset?.settlement_system?.code).toBe(systemCode);
    expect(foundAsset?.account_number).toBe(custodianPayload.account_number);
    expect(foundAsset?.external_account_number).toBe(
      custodianPayload.external_account_number,
    );
    expect(foundAsset?.domestic).toBe(false);
  });
});
