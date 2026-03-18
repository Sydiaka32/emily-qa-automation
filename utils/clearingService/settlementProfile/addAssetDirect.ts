import { config } from "../../../test.config";
import { AddDirectAssetPayload } from "../../../modules/clearing/addDirectAssetPayload";
import { AddedDirectAssetResponse } from "../../../modules/clearing/addedDirectAssetResponse";
import { postRequest } from "@utils/apiUtils";

export async function addDirectAsset(
  operatorToken: string,
  memberXmi: string,
  payload: AddDirectAssetPayload,
): Promise<{ response: any; body: AddedDirectAssetResponse }> {
  const { response, body } = await postRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/direct/fiat`,
    payload,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Add direct asset failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return { response, body };
}
