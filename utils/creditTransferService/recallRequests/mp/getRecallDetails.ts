import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Get recall details by recall ID
 */
export async function getRecallDetails(
  recallId: number,
  token: string,
): Promise<{ response: any; body: any }> {
  const { response, body } = await getRequest(
    `/api/v1/ct/recalls/${recallId}`,
    token,
  );
  expect(response.status()).toBe(200);

  console.log(`Recall details retrieved for: ${recallId}`);

  return { response, body };
}
