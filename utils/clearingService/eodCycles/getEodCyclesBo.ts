import { getRequest } from "@utils/apiUtils";
import { EodCyclesResponse } from "../../../modules/clearing/eodCycle";
import { config } from "../../../test.config";

/**
 * Get EOD cycles list via Back Office
 */
export async function getEodCyclesBo(
  operatorToken: string,
  page: number = 0,
  size: number = 10,
): Promise<EodCyclesResponse> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/eod?page=${page}&size=${size}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get EOD cycles via BO failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
