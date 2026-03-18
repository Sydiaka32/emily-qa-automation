import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Initiate credit transfer (combines approval if needed)
 */
export async function initiateCreditTransfer(
  validationId: string,
  token: string,
): Promise<{ status: number; body: any; referenceId: string }> {
  // Approve the credit transfer (which returns reference_id)
  console.log(`Approving credit transfer with validation ID: ${validationId}`);

  const { response, body } = await postRequest(
    `/api/v1/ct/credit-transfers/validations/${validationId}/approve`,
    {}, // Empty payload for approval
    token,
  );

  expect(response.status()).toBe(200);
  expect(body).toHaveProperty("reference_id");

  const referenceId = body.reference_id;
  console.log(
    `Credit transfer approved and initiated with reference ID: ${referenceId}`,
  );

  return {
    status: response.status(),
    body,
    referenceId,
  };
}
