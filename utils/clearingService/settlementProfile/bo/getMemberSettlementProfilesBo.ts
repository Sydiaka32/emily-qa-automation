import { getRequest } from "@utils/apiUtils";
import { MemberSettlementProfilesResponse } from "../../../../modules/clearing/memberSettlementProfile";
import { config } from "../../../../test.config";

/**
 * Get member settlement profiles via Back Office
 */
export async function getMemberSettlementProfilesBo(
  operatorToken: string,
  page: number = 0,
  size: number = 10,
): Promise<MemberSettlementProfilesResponse> {
  const { response, body } = await getRequest(
    `/api/v1/core-admin/members?services=clr&page=${page}&size=${size}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get member settlement profiles via BO failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
