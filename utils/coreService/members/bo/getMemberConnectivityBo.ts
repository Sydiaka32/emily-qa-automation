import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Get member connectivity details and API key via Back Office
 */
export async function getMemberConnectivityBo(
  operatorToken: string,
  memberXmi: string,
): Promise<{ response: any; body: any }> {
  console.log(`Getting connectivity details for member ${memberXmi}...`);

  const endpoint = `/api/v1/core-admin/connectivity/members/${memberXmi}`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Connectivity details request completed with status: ${result.response.status()}`,
  );
  return result;
}
