import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../test.config";

/**
 * Get system connectivity data (API base URL and test receiver) via Back Office
 */
export async function getSystemConnectivityDataBo(
  operatorToken: string,
): Promise<{ response: any; body: any }> {
  console.log("Getting system connectivity data...");

  const endpoint = `/api/v1/core-admin/connectivity/system`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `System connectivity data request completed with status: ${result.response.status()}`,
  );
  return result;
}
