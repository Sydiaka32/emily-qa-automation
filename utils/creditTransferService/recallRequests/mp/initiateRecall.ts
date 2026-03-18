import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Initiate a recall request for a completed credit transfer
 */
export async function initiateRecall(
  referenceId: string,
  token: string,
  reasonCode: string = "DUPL",
  reasonInfo: string = "Duplicate Payment",
): Promise<{ status: number }> {
  const payload = {
    reason_code: reasonCode,
    reason_info: reasonInfo,
  };

  const { response } = await postRequest(
    `/api/v1/ct/credit-transfers/${referenceId}/recall`,
    payload,
    token,
  );

  console.log(`Recall request response status: ${response.status()}`);

  // Expect 200 status with no response body
  expect(response.status()).toBe(200);

  console.log(`Recall request initiated successfully for CT: ${referenceId}`);

  return {
    status: response.status(),
  };
}
