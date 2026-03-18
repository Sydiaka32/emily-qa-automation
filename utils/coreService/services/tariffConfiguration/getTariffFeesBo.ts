import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Get all fees for a specific tariff
 */
export async function getTariffFeesBo(
  operatorToken: string,
  tariffCode: string,
): Promise<{ response: any; body: any[] }> {
  const endpoint = `/api/v1/core-admin/tariffs/${tariffCode}/fees`;

  console.log(`Getting fees for tariff ${tariffCode}`);
  console.log(`Endpoint: ${endpoint}`);

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  return {
    response: result.response,
    body: result.body || [],
  };
}
