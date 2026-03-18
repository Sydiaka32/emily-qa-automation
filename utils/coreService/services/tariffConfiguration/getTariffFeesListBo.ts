import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Get list of fees for a tariff via Back Office
 */
export async function getTariffFeesListBo(
  operatorToken: string,
  tariffCode: string,
): Promise<{ response: any; body: any }> {
  console.log(`Getting fees list for tariff ${tariffCode}...`);

  const endpoint = `/api/v1/core-admin/tariffs/${tariffCode}/fees`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Fees list request completed with status: ${result.response.status()}`,
  );
  return result;
}
