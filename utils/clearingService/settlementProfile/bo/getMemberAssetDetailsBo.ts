import { getRequest } from "@utils/apiUtils";
import { MemberSettlementAsset } from "../../../../modules/clearing/memberSettlementAsset";
import { config } from "../../../../test.config";

/**
 * Get specific asset details for a member via Back Office
 */
export async function getMemberAssetDetailsBo(
  operatorToken: string,
  xmi: string,
  assetCode: string,
): Promise<MemberSettlementAsset> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/profiles/${xmi}/${assetCode}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get member asset details via BO failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
