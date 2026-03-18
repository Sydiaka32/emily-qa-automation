import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

export async function postCurrencyPair(
  pairPayload: any,
  token: string,
): Promise<any> {
  const apiRequestContext = await createApiRequestContext(
    token,
    config.backofficeBaseUrl,
    {
      "Content-Type": "application/json",
    },
  );

  return await apiRequestContext.post("/api/v1/market-admin/pairs", {
    data: pairPayload,
  });
}
