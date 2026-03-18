import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Get directory of members with CT service
 */
export async function getDirectory(
  token: string,
  search?: string,
  page: number = 0,
  size: number = 10,
): Promise<{ response: any; body: any }> {
  let endpoint = `/api/v1/core/members?services=ct&page=${page}&size=${size}`;

  if (search) {
    endpoint += `&search=${search}`;
  }

  console.log(`Getting directory with endpoint: ${endpoint}`);

  const { response, body } = await getRequest(endpoint, token);

  expect(response.status()).toBe(200);
  expect(body).toHaveProperty("content");
  expect(Array.isArray(body.content)).toBe(true);

  return { response, body };
}
