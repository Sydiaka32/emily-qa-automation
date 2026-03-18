// @utils/coreService/regions/updateRegion.ts
import { expect } from "@playwright/test";
import { config } from "../../../test.config";
import { putRequest } from "@utils/apiUtils";

/**
 * Update region details
 */
export async function updateRegion(
  regionCode: string,
  operatorToken: string,
  updatePayload: any,
): Promise<any> {
  const { response, body } = await putRequest(
    `/api/v1/core-admin/regions/${regionCode}`,
    operatorToken,
    config.backofficeBaseUrl, // Pass as third parameter
    updatePayload, // Pass as fourth parameter
  );

  expect(response.status()).toBe(200);
  console.log(`Updated region ${regionCode} successfully`);

  return body;
}
