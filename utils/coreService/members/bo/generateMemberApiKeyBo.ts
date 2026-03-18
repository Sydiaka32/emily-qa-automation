import { postRequest } from "@utils/apiUtils/httpMethods/postRequest";
import { config } from "../../../../test.config";

/**
 * Generate API key for a member via Back Office
 */
export async function generateMemberApiKeyBo(
  operatorToken: string,
  memberXmi: string,
): Promise<{ response: any; body: any }> {
  console.log(`Generating API key for member ${memberXmi}...`);

  const endpoint = `/api/v1/core-admin/connectivity/members/${memberXmi}/api-key/generate`;

  const result = await postRequest(
    endpoint,
    {}, // Empty payload as per requirements
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `API key generation request completed with status: ${result.response.status()}`,
  );
  return result;
}
