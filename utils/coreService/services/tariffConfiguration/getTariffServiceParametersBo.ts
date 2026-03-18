import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Get service parameters for tariffs via Back Office
 */
export async function getTariffServiceParametersBo(
  operatorToken: string,
): Promise<{ response: any; body: any }> {
  console.log("Getting tariff service parameters...");

  const endpoint = `/api/v1/core-admin/tariffs/service-parameters`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Service parameters request completed with status: ${result.response.status()}`,
  );
  return result;
}
