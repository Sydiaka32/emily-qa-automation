import { config } from "../../../test.config";
import { IndirectCustodian } from "../../../modules/clearing/indirectCustodian";
import { getRequest } from "@utils/apiUtils";

export async function getCustodianIndirect(
  operatorToken: string,
  memberXmi: string,
  assetCode: string,
): Promise<IndirectCustodian[]> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/custodians/${assetCode}/INDIRECT`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get indirect custodian failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
