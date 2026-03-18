import { postRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { AddNoneAssetPayload } from "../../../modules/clearing/addNoneAssetPayload";
import { AddedNoneAssetResponse } from "../../../modules/clearing/addedNoneAssetResponse";

export async function addNoneAsset(
  operatorToken: string,
  memberXmi: string,
  payload: AddNoneAssetPayload,
): Promise<{ response: any; body: AddedNoneAssetResponse }> {
  const { response, body } = await postRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/none`,
    payload,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Add none asset failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return { response, body };
}
