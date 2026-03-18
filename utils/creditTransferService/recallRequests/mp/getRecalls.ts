import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Get recalls list with pagination
 */
export async function getRecalls(
  token: string,
  page: number = 0,
  size: number = 10,
): Promise<{ response: any; body: any }> {
  const endpoint = `/api/v1/ct/recalls?page=${page}&size=${size}`;

  const { response, body } = await getRequest(endpoint, token);

  expect(response.status()).toBe(200);

  // Verify response structure
  expect(body).toHaveProperty("total_pages");
  expect(body).toHaveProperty("total_elements");
  expect(body).toHaveProperty("content");
  expect(Array.isArray(body.content)).toBe(true);

  console.log(`Found ${body.total_elements} recalls in list`);

  return { response, body };
}
