import { postRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";

/**
 * Cancel a credit transfer
 */
export async function cancelCreditTransfer(
  referenceId: string,
  token: string,
): Promise<{ status: number; body: any }> {
  const { response, body } = await postRequest(
    `/api/v1/ct/credit-transfers/${referenceId}/cancel`,
    {}, // Empty payload
    token,
    config.apiBaseUrl,
  );

  console.log(`Cancel response status: ${response.status()}`);

  return {
    status: response.status(),
    body,
  };
}
