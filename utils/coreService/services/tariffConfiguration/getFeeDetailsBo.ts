import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Get details of a specific fee via Back Office
 */
export async function getFeeDetailsBo(
  operatorToken: string,
  tariffCode: string,
  feeCode: string,
): Promise<{ response: any; body: any }> {
  console.log(`Getting details for fee ${feeCode} in tariff ${tariffCode}...`);

  const endpoint = `/api/v1/core-admin/tariffs/${tariffCode}/fees/${feeCode}`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Fee details request completed with status: ${result.response.status()}`,
  );
  return result;
}
