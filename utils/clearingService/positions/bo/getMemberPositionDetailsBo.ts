import { getRequest } from "@utils/apiUtils";
import { MemberPositionDetails } from "../../../../modules/clearing/memberPositionDetail";
import { config } from "../../../../test.config";

/**
 * Get position details for a specific member via Back Office
 */
export async function getMemberPositionDetailsBo(
  operatorToken: string,
  xmi: string,
): Promise<MemberPositionDetails[]> {
  const { response, body } = await getRequest(
    `/api/v1/core-admin/members/${xmi}/positions`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get member position details failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
