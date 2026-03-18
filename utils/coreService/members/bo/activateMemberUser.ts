import { postRequest } from "@utils/apiUtils";
import { MemberUser } from "../../../../modules/core/memberUser";
import { config } from "../../../../test.config";

/**
 * Activate a user for a specific member via Back Office
 */
export async function activateMemberUser(
  operatorToken: string,
  memberXmi: string,
  userId: string,
): Promise<MemberUser> {
  const { response, body } = await postRequest(
    `/api/v1/core-admin/members/${memberXmi}/users/${userId}/activate`,
    {}, // Empty payload object since nobody is needed for activate
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Activate user ${userId} for member ${memberXmi} failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
