import { putRequest } from "@utils/apiUtils/httpMethods/putRequest";
import { config } from "../../../../test.config";

/**
 * Update member callback URL via Back Office
 */
export async function updateMemberCallbackUrlBo(
  operatorToken: string,
  memberXmi: string,
  callbackUrl: string,
): Promise<{ response: any; body: any; error?: string }> {
  console.log(`Updating callback URL for member ${memberXmi}...`);
  console.log(`New callback URL: ${callbackUrl}`);

  const endpoint = `/api/v1/core-admin/connectivity/members/${memberXmi}/url`;

  const payload = {
    url: callbackUrl,
  };

  const result = await putRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
    payload,
  );

  console.log(
    `Callback URL update request completed with status: ${result.response.status()}`,
  );
  return result;
}
