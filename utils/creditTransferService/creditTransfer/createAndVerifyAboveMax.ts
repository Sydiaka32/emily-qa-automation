import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

export async function createAndVerifyAboveMax(
  cctPayload: any,
  senderToken: string,
  expectedMaxAmount: number,
): Promise<{ status: number; body: any; errorMessage?: string }> {
  console.log("Attempting to create CCT with amount above maximum...");
  console.log(`Expected maximum amount: ${expectedMaxAmount}`);
  console.log(`Payload amount: ${cctPayload.creditor_amount}`);

  let response: any;
  let body: any;
  let status: number;
  let errorMessage: string | undefined;

  try {
    const result = await postRequest(
      "/api/v1/ct/credit-transfers/cct",
      cctPayload,
      senderToken,
    );
    response = result.response;
    body = result.body;
    status = response.status();

    // If we get here and status is 200, that's unexpected
    if (status === 200) {
      console.error("UNEXPECTED: CCT creation succeeded with invalid amount!");
      errorMessage = "CCT creation should have failed but succeeded";
    }
  } catch (error: any) {
    // Extract error information from thrown error
    status = error.response?.status || 500;
    body = error.body || error.message;
    errorMessage = error.message;

    console.log(`CCT creation failed as expected with status: ${status}`);
  }

  console.log("Response Status:", status);
  console.log("Response Body:", JSON.stringify(body, null, 2));

  // Validate that the request failed with status 400
  expect(status).toBe(400);
  console.log("CCT creation correctly failed with status 400");

  // Validate that the amount in the payload is indeed above maximum
  expect(cctPayload.creditor_amount).toBeGreaterThan(expectedMaxAmount);
  console.log(
    `Amount ${cctPayload.creditor_amount} is above maximum ${expectedMaxAmount}`,
  );

  return { status, body, errorMessage };
}
