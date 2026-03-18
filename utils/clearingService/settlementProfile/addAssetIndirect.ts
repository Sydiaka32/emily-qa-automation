import { postRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { AddIndirectAssetPayload } from "../../../modules/clearing/addIndirectAssetPayload";
import { AddedIndirectAssetResponse } from "../../../modules/clearing/addedIndirectAssetResponse";


export async function addIndirectAsset(
  operatorToken: string,
  memberXmi: string,
  payload: AddIndirectAssetPayload,
): Promise<{ response: any; body: AddedIndirectAssetResponse }> {
  const { response, body } = await postRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/indirect`,
    payload,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Add indirect asset failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return { response, body };
}
