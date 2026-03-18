import { getRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { SettlementCyclesResponse } from "../../../modules/clearing/settlementCyclesResponse";

export async function getSettlementCycles(
  operatorToken: string,
  page: number = 0,
  size: number = 10,
): Promise<SettlementCyclesResponse> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/settlements?page=${page}&size=${size}`,
    operatorToken,
    config.backofficeBaseUrl, // Use backoffice base URL for operator endpoints
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get settlement cycles failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
