import { expect } from "@playwright/test";
import { config } from "../../../test.config";
import { getRequest } from "@utils/apiUtils";


/**
 * Get region details by region code
 */
export async function getRegionByCode(
  regionCode: string,
  operatorToken: string,
): Promise<any> {
  const { response, body } = await getRequest(
    `/api/v1/core-admin/regions/${regionCode}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  expect(response.status()).toBe(200);
  console.log(`Retrieved region details for ${regionCode}: ${body.name}`);

  return body;
}
