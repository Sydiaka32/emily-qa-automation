import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Get list of tariff configurations via Back Office
 */
export async function getTariffsListBo(
  operatorToken: string,
): Promise<{ response: any; body: any }> {
  console.log("Getting list of tariff configurations...");

  const endpoint = `/api/v1/core-admin/tariffs`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Tariffs list request completed with status: ${result.response.status()}`,
  );
  return result;
}
