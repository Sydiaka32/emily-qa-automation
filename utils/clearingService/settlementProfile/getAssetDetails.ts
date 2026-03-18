import { getRequest } from "@utils/apiUtils";
import { SettlementAsset } from "../../../modules/clearing/settlementAsset";

/**
 * Get details for a specific settlement asset by code
 */
export async function getAssetDetails(
  authToken: string,
  assetCode: string,
): Promise<SettlementAsset> {
  const { response, body } = await getRequest(
    `/api/v1/settlement/profiles/${assetCode}`,
    authToken,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get asset details failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
