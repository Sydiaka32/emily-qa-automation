import { getRequest } from "@utils/apiUtils";
import { MembersResponse } from "../../../../modules/clearing/member";
import { config } from "../../../../test.config";

/**
 * Get members list via Back Office
 */
export async function getMembersBo(
  operatorToken: string,
  page: number = 0,
  size: number = 10,
): Promise<MembersResponse> {
  const { response, body } = await getRequest(
    `/api/v1/core-admin/members?services=clr&with_ledger_settings=true&page=${page}&size=${size}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get members via BO failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
