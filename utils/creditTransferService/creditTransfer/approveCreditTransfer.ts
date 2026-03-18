import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

export async function approveCreditTransfer(
  validationId: string,
  senderToken: string,
): Promise<{ referenceId: string; approveBody: any }> {
  console.log(`Approving FICT with validation ID: ${validationId}`);
  const { response: approveResponse, body: approveBody } = await postRequest(
    `/api/v1/ct/credit-transfers/validations/${validationId}/approve`,
    {}, // Empty payload for approve
    senderToken,
  );

  console.log("FICT Approval Response:", JSON.stringify(approveBody, null, 2));

  // Validate approval response
  expect(approveResponse.status()).toBe(200);
  expect(approveBody).toHaveProperty("reference_id");

  const referenceId = approveBody.reference_id;
  console.log(`FICT approved successfully with reference ID: ${referenceId}`);

  return { referenceId, approveBody };
}
