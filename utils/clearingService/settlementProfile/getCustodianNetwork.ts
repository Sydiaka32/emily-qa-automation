import { config } from "../../../test.config";
import { NetworkCustodian } from "../../../modules/clearing/networkCustodian";
import { getRequest } from "@utils/apiUtils";

export async function getCustodianNetwork(
  operatorToken: string,
  memberXmi: string,
  assetCode: string,
): Promise<NetworkCustodian[]> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/custodians/${assetCode}/NETWORK`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get network custodian failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
