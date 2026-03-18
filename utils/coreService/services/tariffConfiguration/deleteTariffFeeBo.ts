import { deleteRequest } from "@utils/apiUtils/httpMethods/deleteRequest";
import { config } from "../../../../test.config";

/**
 * Delete a fee from a tariff in Back Office
 */
export async function deleteTariffFeeBo(
  operatorToken: string,
  tariffCode: string,
  feeCode: string,
): Promise<{ response: any; body: any }> {
  const endpoint = `/api/v1/core-admin/tariffs/${tariffCode}/fees/${feeCode}`;

  console.log(`Deleting fee ${feeCode} from tariff ${tariffCode}`);
  console.log(`Endpoint: ${endpoint}`);

  return await deleteRequest(endpoint, operatorToken, config.backofficeBaseUrl);
}
