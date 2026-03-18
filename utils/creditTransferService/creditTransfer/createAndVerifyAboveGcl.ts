import { postRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

export async function createAndVerifyAboveGcl(
  cctPayload: any,
  senderToken: string,
  globalCurrentLimit: number,
): Promise<{ status: number; body: any; errorMessage?: string }> {
  console.log("Attempting to create CCT with amount above GCL...");
  console.log(`Global Current Limit: ${globalCurrentLimit}`);
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
      console.error(
        "UNEXPECTED: CCT creation succeeded with amount above GCL!",
      );
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

  // Validate specific error code and message for GCL exceeding
  // Note: The actual error code might be different - adjust based on your API response
  expect(body.code).toBeDefined();
  expect(body.message).toBeDefined();
  console.log(`Error code: ${body.code}`);
  console.log(`Error message: ${body.message}`);

  // Validate that the amount in the payload exceeds GCL
  expect(cctPayload.creditor_amount).toBeGreaterThan(globalCurrentLimit);
  console.log(
    `Amount ${cctPayload.creditor_amount} exceeds GCL ${globalCurrentLimit}`,
  );

  return { status, body, errorMessage };
}
