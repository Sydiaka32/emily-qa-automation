import { config } from "../../../test.config";
import { MemberSettlementAsset } from "../../../modules/clearing/memberSettlementAsset";
import { getRequest } from "@utils/apiUtils";

export async function getMemberSettlementAssets(
  operatorToken: string,
  memberXmi: string,
): Promise<MemberSettlementAsset[]> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get member settlement assets failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
