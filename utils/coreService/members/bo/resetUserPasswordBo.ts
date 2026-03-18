import { postRequest } from "@utils/apiUtils/httpMethods/postRequest";
import { config } from "../../../../test.config";

/**
 * Reset user password via Back Office
 */
export async function resetUserPasswordBo(
  operatorToken: string,
  memberXmi: string,
  userId: string,
): Promise<{ response: any; body: any }> {
  console.log(
    `Resetting password for user ${userId} in member ${memberXmi}...`,
  );

  const endpoint = `/api/v1/core-admin/members/${memberXmi}/users/${userId}/reset-password`;

  const result = await postRequest(
    endpoint,
    {}, // Empty payload as per requirements
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Password reset request completed with status: ${result.response.status()}`,
  );
  return result;
}
