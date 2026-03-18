import { postRequest } from "@utils/apiUtils";
import { DeclineRecallPayload } from "../../../../modules/creditTransfer/declineRecallPayload";
import { expect } from "@playwright/test";

/**
 * Decline a recall by receiver
 */
// Add this to your declineRecall function for better debugging
export async function declineRecall(
  recallId: string,
  token: string,
  payload: DeclineRecallPayload,
): Promise<{ response: any; body: any }> {
  const endpoint = `/api/v1/ct/recalls/${recallId}/reject`;

  console.log(`=== Decline Recall Debug ===`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Recall ID: ${recallId}`);
  console.log(`Token (first 20 chars): ${token.substring(0, 20)}...`);
  console.log(`Payload:`, payload);
  console.log(`========================`);

  const { response, body } = await postRequest(
    endpoint,
    JSON.stringify(payload),
    token,
  );

  console.log(`Response status: ${response.status()}`);
  console.log(`Response body:`, body);

  if (response.status() !== 200) {
    console.error(`Decline recall failed with status: ${response.status()}`);
    console.error(`Response body:`, body);
  }

  expect(response.status()).toBe(200);

  console.log(`Successfully declined recall ${recallId}`);

  return { response, body };
}
