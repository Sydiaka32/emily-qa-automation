import { deleteMemberAsset } from "./deleteMemberAsset";
import { CleanupAssetParams } from "../../../modules/clearing/cleanupAssetParams";

/**
 * Cleans up a single asset if it was added during the test
 */
export async function cleanupAsset({
  operatorToken,
  memberXmi,
  assetCode,
  wasAdded,
  assetDescription = "asset",
}: CleanupAssetParams): Promise<void> {
  if (!wasAdded || !assetCode) {
    return;
  }

  try {
    console.log(
      `Cleaning up: Deleting ${assetDescription} ${assetCode} for member ${memberXmi}`,
    );

    const deleteResponse = await deleteMemberAsset(
      operatorToken,
      memberXmi,
      assetCode,
    );

    if (deleteResponse.response.status() === 200) {
      console.log(`Successfully deleted ${assetDescription} ${assetCode}`);
    } else {
      console.log(
        `Failed to delete ${assetDescription} ${assetCode}: Status ${deleteResponse.response.status()}`,
      );
    }
  } catch (error) {
    console.error(`Error deleting ${assetDescription} ${assetCode}:`, error);
  }
}
