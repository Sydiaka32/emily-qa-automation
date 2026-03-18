import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Get credit transfers list with optional search
 */
export async function getCreditTransfers(
  token: string,
  search?: string,
  page: number = 0,
  size: number = 10,
): Promise<{ response: any; body: any }> {
  let endpoint = `/api/v1/ct/credit-transfers?page=${page}&size=${size}`;

  if (search) {
    endpoint += `&search=${search}`;
  }

  const { response, body } = await getRequest(endpoint, token);

  expect(response.status()).toBe(200);
  expect(body).toHaveProperty("content");
  expect(Array.isArray(body.content)).toBe(true);

  return { response, body };
}
