import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Get settlement profile for an asset to check RTGS support
 */
export async function getSettlementProfile(
  asset: string,
  token: string,
): Promise<any> {
  const { response, body } = await getRequest(
    `/api/v1/settlement/profiles/${asset}`,
    token,
  );

  expect(response.status()).toBe(200);
  return body;
}
