import { getRequest } from "@utils/apiUtils";
import { Collateral } from "../../../modules/core/collaterals";
import { config } from "../../../test.config";

/**
 * Get collaterals for a specific member via Back Office
 */
export async function getMemberCollaterals(
  operatorToken: string,
  memberXmi: string,
): Promise<Collateral[]> {
  const { response, body } = await getRequest(
    `/api/v1/core-admin/members/${memberXmi}/collaterals`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get collaterals for member ${memberXmi} failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
