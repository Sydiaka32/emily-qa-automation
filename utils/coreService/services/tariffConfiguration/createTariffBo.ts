import { postRequest } from "@utils/apiUtils/httpMethods/postRequest";
import { config } from "../../../../test.config";

/**
 * Create a new tariff via Back Office
 */
export async function createTariffBo(
  operatorToken: string,
  name: string,
  assetCode: string,
): Promise<{ response: any; body: any }> {
  console.log(
    `Creating new tariff with name: ${name}, asset_code: ${assetCode}...`,
  );

  const endpoint = `/api/v1/core-admin/tariffs`;

  const payload = {
    name: name,
    asset_code: assetCode,
  };

  const result = await postRequest(
    endpoint,
    payload,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Tariff creation request completed with status: ${result.response.status()}`,
  );
  return result;
}
