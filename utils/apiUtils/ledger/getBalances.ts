import { config } from "../../../test.config";
import { Balance } from "../../../modules/clearing/balance";
import { createApiRequestContext } from "@utils/apiUtils";

export async function getBalances(
  token: string,
): Promise<{ response: any; body: Balance[] }> {
  const apiRequestContext = await createApiRequestContext(
    token,
    config.apiBaseUrl,
  );

  const response = await apiRequestContext.get("/api/v1/ledger/positions");
  const body = (await response.json()) as Balance[];
  return { response, body };
}
