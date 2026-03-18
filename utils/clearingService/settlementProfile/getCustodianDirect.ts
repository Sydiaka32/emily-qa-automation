import { config } from "../../../test.config";
import { DirectCustodian } from "../../../modules/clearing/directCustodian";
import { getRequest } from "@utils/apiUtils";

export async function getCustodianDirect(
  operatorToken: string,
  memberXmi: string,
  assetCode: string,
): Promise<DirectCustodian[]> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/custodians/${assetCode}/DIRECT`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get direct custodian failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
