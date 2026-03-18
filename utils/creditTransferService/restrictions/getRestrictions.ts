import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Get restrictions list
 */
export async function getRestrictions(
  token: string,
  page: number = 0,
  size: number = 10,
): Promise<{ response: any; body: any }> {
  const endpoint = `/api/v1/ct/restrictions?page=${page}&size=${size}`;

  console.log(`Getting restrictions with endpoint: ${endpoint}`);

  const { response, body } = await getRequest(endpoint, token);

  expect(response.status()).toBe(200);
  expect(body).toHaveProperty("content");
  expect(Array.isArray(body.content)).toBe(true);

  return { response, body };
}
