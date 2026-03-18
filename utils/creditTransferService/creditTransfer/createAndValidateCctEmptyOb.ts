import { postRequest } from "@utils/apiUtils";

export async function createAndValidateCctEmptyOrderBook(
  cctPayload: any,
  senderToken: string,
): Promise<{ status: number; body: any }> {
  const { response, body } = await postRequest(
    "/api/v1/ct/credit-transfers/cct",
    cctPayload,
    senderToken,
  );

  console.log(
    "CCT Creation Response (Empty OB):",
    JSON.stringify(body, null, 2),
  );
  console.log("CCT Creation Status (Empty OB):", response.status());

  // We expect this to fail, so we don't validate for success
  // Just return the response for the test to handle
  return {
    status: response.status(),
    body,
  };
}
