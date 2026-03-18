import { postRequest } from "@utils/apiUtils";

/**
 * Attempt to create a CT with a restricted member and verify the error
 */
export async function createAndVerifyRestrictedMember(
  payload: any,
  token: string,
): Promise<{ status: number; body: any }> {
  const endpoint = "/api/v1/ct/credit-transfers/cct";

  console.log(`Attempting to create CT to restricted member...`);
  console.log(`Payload:`, JSON.stringify(payload, null, 2));

  const { response, body } = await postRequest(
    endpoint,
    JSON.stringify(payload),
    token,
  );

  console.log(`Response status: ${response.status()}`);
  console.log(`Response body:`, JSON.stringify(body, null, 2));

  return { status: response.status(), body };
}
