import { postRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { AddNetworkAssetPayload } from "../../../modules/clearing/addNetworkAssetPayload";
import { AddedNetworkAssetResponse } from "../../../modules/clearing/addedNetworkAssetResponse";

export async function addAssetNetwork(
  operatorToken: string,
  memberXmi: string,
  payload: AddNetworkAssetPayload,
): Promise<{ response: any; body: AddedNetworkAssetResponse }> {
  const { response, body } = await postRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/network/fiat`,
    payload,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Add network asset failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return { response, body };
}
