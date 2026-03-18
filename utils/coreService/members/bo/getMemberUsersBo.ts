import { getRequest } from "@utils/apiUtils";
import { MemberUsersResponse } from "../../../../modules/core/memberUser";
import { config } from "../../../../test.config";

/**
 * Get users for a specific member via Back Office
 */
export async function getMemberUsersBo(
  operatorToken: string,
  memberXmi: string,
  page: number = 0,
  size: number = 10,
): Promise<MemberUsersResponse> {
  const { response, body } = await getRequest(
    `/api/v1/core-admin/members/${memberXmi}/users?page=${page}&size=${size}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get users for member ${memberXmi} failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
