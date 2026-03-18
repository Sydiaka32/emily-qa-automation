import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";
import { config } from "../../../../test.config";

/**
 * Initiate a credit return for a completed credit transfer
 */
export async function initiateCreditReturnBo(
  referenceId: string,
  token: string,
  reasonCode: string = "AM03",
  reasonInfo: string = "Not Allowed Currency",
  baseUrl: string = config.backofficeBaseUrl,
): Promise<{ status: number }> {
  const payload = {
    reason_code: reasonCode,
    reason_info: reasonInfo,
  };

  const { response } = await postRequest(
    `/api/v1/ct-admin/credit-transfers/${referenceId}/return`,
    payload,
    token,
    baseUrl,
  );

  console.log(`Credit return response status: ${response.status()}`);

  // Expect 200 status with no response body
  expect(response.status()).toBe(200);

  console.log(`Credit return initiated successfully for CT: ${referenceId}`);

  return {
    status: response.status(),
  };
}
