import { config } from "../../../test.config";
import { getRequest } from "@utils/apiUtils";
import { CustodianResponse } from "../../../modules/clearing/custodianResponse";

export async function getCustodianNone(
  operatorToken: string,
  memberXmi: string,
  assetCode: string,
): Promise<CustodianResponse[]> {
  // Return the entire array
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/custodians/${assetCode}/NONE`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get none custodian failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  // Return the entire response body as array
  return body as CustodianResponse[];
}
