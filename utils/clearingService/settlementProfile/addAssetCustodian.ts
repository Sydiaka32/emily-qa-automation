import { config } from "../../../test.config";
import { AddCustodianAssetPayload } from "../../../modules/clearing/addCustodianAssetPayload";
import { AddedCustodianAssetResponse } from "../../../modules/clearing/addedCustodianAssetResponse";
import { postRequest } from "@utils/apiUtils";

export async function addAssetCustodian(
  operatorToken: string,
  memberXmi: string,
  payload: AddCustodianAssetPayload,
): Promise<{ response: any; body: AddedCustodianAssetResponse }> {
  // Try different possible endpoints for custodian assets
  const { response, body } = await postRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/custodian/fiat`,
    payload,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Add custodian asset failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return { response, body };
}
