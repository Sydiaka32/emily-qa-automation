import { expect } from "@playwright/test";
import { getRequest } from "@utils/apiUtils";
import { config } from "../../../../test.config";

/**
 * Get credit transfers list for Back Office
 */
export async function getCreditTransfersBo(
  token: string,
  search?: string,
  page: number = 0,
  size: number = 10,
): Promise<{ response: any; body: any }> {
  let endpoint = `/api/v1/ct-admin/credit-transfers?page=${page}&size=${size}`;

  if (search) {
    endpoint += `&search=${search}`;
  }

  const { response, body } = await getRequest(
    endpoint,
    token,
    config.backofficeBaseUrl,
  );

  expect(response.status()).toBe(200);
  expect(body).toHaveProperty("content");
  expect(Array.isArray(body.content)).toBe(true);

  return { response, body };
}
