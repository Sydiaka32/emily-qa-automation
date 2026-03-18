import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Get details of a specific tariff via Back Office
 */
export async function getTariffDetailsBo(
  operatorToken: string,
  tariffCode: string,
): Promise<{ response: any; body: any }> {
  console.log(`Getting details for tariff ${tariffCode}...`);

  const endpoint = `/api/v1/core-admin/tariffs/${tariffCode}`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Tariff details request completed with status: ${result.response.status()}`,
  );
  return result;
}
