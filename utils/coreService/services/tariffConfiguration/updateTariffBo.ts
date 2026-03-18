import { putRequest } from "@utils/apiUtils/httpMethods/putRequest";
import { config } from "../../../../test.config";

/**
 * Update tariff parameters via Back Office
 */
export async function updateTariffBo(
  operatorToken: string,
  tariffCode: string,
  name: string,
  assetCode: string,
): Promise<{ response: any; body: any; error?: string }> {
  console.log(`Updating tariff ${tariffCode}...`);
  console.log(`New name: ${name}`);
  console.log(`New asset_code: ${assetCode}`);

  const endpoint = `/api/v1/core-admin/tariffs/${tariffCode}`;

  const payload = {
    name: name,
    asset_code: assetCode,
  };

  const result = await putRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
    payload,
  );

  console.log(
    `Tariff update request completed with status: ${result.response.status()}`,
  );
  return result;
}
