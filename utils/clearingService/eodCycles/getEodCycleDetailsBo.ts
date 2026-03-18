import { getRequest } from "@utils/apiUtils";
import { EodCycleDetails } from "../../../modules/clearing/eodCycleDetails";
import { config } from "../../../test.config";

/**
 * Get specific EOD cycle details via Back Office
 */
export async function getEodCycleDetailsBo(
  operatorToken: string,
  eodId: string,
): Promise<EodCycleDetails> {
  const { response, body } = await getRequest(
    `/api/v1/settlement-admin/eod/${eodId}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get EOD cycle details via BO failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
