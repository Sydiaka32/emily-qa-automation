import { getRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { AllowedAsset } from "../../../modules/clearing/allowedAsset";


export async function getAllowedAssets(
  operatorToken: string,
  memberXmi: string,
): Promise<AllowedAsset[]> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/allowedAssets`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get allowed assets failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
