import { config } from "../../../../test.config";
import { putRequest } from "@utils/apiUtils/httpMethods/putRequest";

/**
 * Assign a tariff to a region via Back Office
 */
export async function assignTariffToRegionBo(
  operatorToken: string,
  regionCode: string,
  tariffCode: string,
): Promise<{ response: any; body: any }> {
  console.log(`Assigning tariff ${tariffCode} to region ${regionCode}...`);

  const endpoint = `/api/v1/core-admin/regions/${regionCode}/tariffs/${tariffCode}`;

  const result = await putRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
    {}, // empty payload
  );

  console.log(
    `Assign tariff to region request completed with status: ${result.response.status()}`,
  );
  return result;
}
