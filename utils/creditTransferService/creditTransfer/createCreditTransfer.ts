import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Create credit transfer
 */
export async function createCreditTransfer(
  ctPayload: any,
  token: string,
): Promise<{ status: number; body: any; validationId: string }> {
  const { response, body } = await postRequest(
    "/api/v1/ct/credit-transfers/cct",
    ctPayload,
    token,
  );

  console.log(`Credit transfer response status: ${response.status()}`);
  console.log(
    `Credit transfer response body: ${JSON.stringify(body, null, 2)}`,
  );

  // Check if response is successful
  if (response.status() !== 200) {
    console.error(
      `Credit transfer failed with status ${response.status()}:`,
      body,
    );
    throw new Error(
      `Credit transfer creation failed: ${response.status()} - ${JSON.stringify(body)}`,
    );
  }

  expect(response.status()).toBe(200);
  expect(body).toHaveProperty("validation_id");

  const validationId = body.validation_id;
  console.log(
    `Credit transfer created successfully with validation ID: ${validationId}`,
  );

  return {
    status: response.status(),
    body,
    validationId,
  };
}
