import { getRequest } from "@utils/apiUtils";
import { SettlementSystemsResponse } from "../../../modules/clearing/settlementSystem";
import { config } from "../../../test.config";

/**
 * Get settlement systems list via Back Office
 */
export async function getSettlementSystemsBo(
  operatorToken: string,
  page: number = 0,
  size: number = 10,
): Promise<SettlementSystemsResponse> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/systems?page=${page}&size=${size}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get settlement systems via BO failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
