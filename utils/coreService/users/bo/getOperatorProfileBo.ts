import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Get operator profile via Back Office
 */
export async function getOperatorProfileBo(
  operatorToken: string,
  operatorId: string,
): Promise<{ response: any; body: any }> {
  console.log(`Getting operator profile for ID: ${operatorId}...`);

  const endpoint = `/api/v1/core-admin/operators/${operatorId}`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Get operator profile request completed with status: ${result.response.status()}`,
  );
  return result;
}
