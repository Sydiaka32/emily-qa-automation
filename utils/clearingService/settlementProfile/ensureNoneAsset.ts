import { config } from "../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { getMemberSettlementAssets } from "./getMemberSettlementAssets";
import { getAllowedAssets } from "./getAllowedAssets";
import { AddNoneAssetPayload } from "../../../modules/clearing/addNoneAssetPayload";
import { addNoneAsset } from "./addAssetNone";
import { EnsureNoneAssetResult } from "../../../modules/clearing/ensureNoneAssetResult";

/**
 * Ensures that a member has at least one none-type settlement asset
 * @param memberXmi - The member XMI identifier
 * @returns Promise with the result of the operation
 */
export async function ensureNoneAsset(
  memberXmi: string = config.setMemberXmi,
): Promise<EnsureNoneAssetResult> {
  let operatorToken: string;

  try {
    // Get operator authentication token
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // Step 1: Check if member already has settlement assets
    const currentAssets = await getMemberSettlementAssets(
      operatorToken,
      memberXmi,
    );

    // If member already has at least one asset, no need to add anything
    if (currentAssets.length > 0) {
      return {
        success: true,
        message: `Member already has ${currentAssets.length} settlement asset(s)`,
      };
    }

    // Step 2: Get allowed assets for the member
    const allowedAssets = await getAllowedAssets(operatorToken, memberXmi);
    const currentAssetCodes = currentAssets.map((asset) => asset.asset.code);

    // Find an asset that is allowed but not currently configured
    const assetToAdd = allowedAssets.find(
      (asset) => !currentAssetCodes.includes(asset.code),
    );

    if (!assetToAdd) {
      return {
        success: false,
        message: "No available allowed assets to add for member",
      };
    }

    // Step 3: Add none asset - use the correct payload structure without asset_type
    const assetPayload: AddNoneAssetPayload = {
      asset: assetToAdd.code,
      custodian_xmi: memberXmi, // Use member's own XMI as custodian
    };

    const addResponse = await addNoneAsset(
      operatorToken,
      memberXmi,
      assetPayload,
    );

    // Verify that asset was added successfully
    if (addResponse.response.status() !== 200) {
      return {
        success: false,
        message: `Failed to add asset: HTTP ${addResponse.response.status()}`,
      };
    }

    // Step 4: Verify the asset was actually added
    const updatedAssets = await getMemberSettlementAssets(
      operatorToken,
      memberXmi,
    );
    const foundAsset = updatedAssets.find(
      (asset) => asset.asset.code === assetToAdd.code,
    );

    if (!foundAsset) {
      return {
        success: false,
        message: "Asset was added but not found in member's settlement assets",
      };
    }

    return {
      success: true,
      assetCode: assetToAdd.code,
      message: `Successfully added none asset: ${assetToAdd.code}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error ensuring none asset: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
