import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../test.config";

/**
 * Get list of assets via Back Office
 */
export async function getAssetsListBo(
  operatorToken: string,
): Promise<{ response: any; body: any }> {
  console.log("Getting list of assets...");

  const endpoint = `/api/v1/ledger-admin/assets`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Assets list request completed with status: ${result.response.status()}`,
  );
  return result;
}
