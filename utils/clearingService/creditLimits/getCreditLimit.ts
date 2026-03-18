import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Get current credit limit
 */
export async function getCreditLimit(token: string): Promise<any> {
  const { response, body } = await getRequest(
    "/api/v1/ledger/current/credit-limit",
    token,
  );

  expect(response.status()).toBe(200);
  return body;
}
