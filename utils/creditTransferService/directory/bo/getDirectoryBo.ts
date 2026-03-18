import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";
import { config } from "../../../../test.config";

/**
 * Get directory of members with CT service via Back Office
 */
export async function getDirectoryBo(
  operatorToken: string,
  search?: string,
  page: number = 0,
  size: number = 10,
): Promise<{ response: any; body: any }> {
  let endpoint = `/api/v1/core-admin/members?services=ct&page=${page}&size=${size}`;

  if (search) {
    endpoint += `&search=${search}`;
  }

  console.log(`Getting BO directory with endpoint: ${endpoint}`);

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
