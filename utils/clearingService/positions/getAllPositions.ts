import { getRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { AllPositionsResponse } from "../../../modules/clearing/allPositionsResponse";

export async function getAllPositions(
  operatorToken: string,
  page: number = 0,
  size: number = 10,
): Promise<AllPositionsResponse> {
  const { response, body } = await getRequest(
    `/api/v1/core-admin/members?services=clr&with_ledger_settings=true&page=${page}&size=${size}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get all positions failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
