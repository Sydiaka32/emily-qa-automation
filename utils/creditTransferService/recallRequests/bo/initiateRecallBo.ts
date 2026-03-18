import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";
import { config } from "../../../../test.config";

/**
 * Initiate a recall request for a completed credit transfer via Back Office
 */
export async function initiateRecallBo(
  referenceId: string,
  token: string,
  reasonCode: string = "DUPL",
  reasonInfo: string = "Duplicate Payment",
): Promise<{ response: any; body: any }> {
  const payload = {
    reason_code: reasonCode,
    reason_info: reasonInfo,
  };

  const { response, body } = await postRequest(
    `/api/v1/ct-admin/credit-transfers/${referenceId}/recall`,
    payload,
    token,
    config.backofficeBaseUrl,
  );

  console.log(`BO Recall request response status: ${response.status()}`);
  expect(response.status()).toBe(200);

  console.log(
    `BO Recall request initiated successfully for CT: ${referenceId}`,
  );

  return { response, body };
}
