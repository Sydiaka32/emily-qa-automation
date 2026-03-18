import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";
import { config } from "../../../../test.config";

/**
 * Get restrictions list via Back Office
 */
export async function getRestrictionsBo(
  operatorToken: string,
  page: number = 0,
  size: number = 10,
): Promise<{ response: any; body: any }> {
  const endpoint = `/api/v1/ct-admin/restrictions?page=${page}&size=${size}`;

  console.log(`Getting BO restrictions with endpoint: ${endpoint}`);

  const { response, body } = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  expect(response.status()).toBe(200);
  expect(body).toHaveProperty("content");
  expect(Array.isArray(body.content)).toBe(true);

  return { response, body };
}
