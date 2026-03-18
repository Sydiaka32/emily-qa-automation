import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../test.config";

/**
 * Get all regions (for operator)
 */
export async function getAllRegions(
  operatorToken: string,
): Promise<{ response: any; body: any }> {
  console.log("Getting all regions...");

  const endpoint = `/api/v1/core-admin/regions`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Get all regions request completed with status: ${result.response.status()}`,
  );
  return result;
}
