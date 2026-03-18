import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Get creditors list
 */
export async function getCreditors(token: string): Promise<any[]> {
  const { response, body } = await getRequest(
    "/api/v1/ct/credit-transfers/creditors",
    token,
  );

  expect(response.status()).toBe(200);
  expect(Array.isArray(body)).toBe(true);

  console.log(`Found ${body.length} creditors in the list`);
  return body;
}
