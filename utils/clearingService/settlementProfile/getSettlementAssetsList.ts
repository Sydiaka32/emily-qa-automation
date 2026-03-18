import { getRequest } from "@utils/apiUtils";
import { SettlementAsset } from "../../../modules/clearing/settlementAsset";

export async function getSettlementAssetsList(
  authToken: string,
): Promise<SettlementAsset[]> {
  const { response, body } = await getRequest(
    "/api/v1/settlement/profiles",
    authToken,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get settlement assets failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
