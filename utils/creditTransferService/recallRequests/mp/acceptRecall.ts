import { expect } from "@playwright/test";
import { postRequest } from "@utils/apiUtils";

/**
 * Accept a recall request
 */
export async function acceptRecall(
  recallId: number,
  token: string,
): Promise<{ status: number; body: any }> {
  const { response, body } = await postRequest(
    `/api/v1/ct/recalls/${recallId}/accept`,
    {},
    token,
  );

  console.log(`Recall accept response status: ${response.status()}`);
  console.log(`Recall accept response body: ${JSON.stringify(body, null, 2)}`);

  expect(response.status()).toBe(200);

  console.log(`Recall ${recallId} accepted successfully`);

  return {
    status: response.status(),
    body,
  };
}
