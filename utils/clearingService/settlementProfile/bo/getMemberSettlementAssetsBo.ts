import { getRequest } from "@utils/apiUtils";
import { MemberSettlementAssetsResponse } from "../../../../modules/clearing/memberSettlementAsset";
import { config } from "../../../../test.config";

/**
 * Get settlement profile details for a specific member via Back Office
 */
export async function getMemberSettlementAssetsBo(
  operatorToken: string,
  xmi: string,
): Promise<MemberSettlementAssetsResponse> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/profiles/${xmi}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get member settlement assets via BO failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
