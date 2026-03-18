import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

export async function deleteCurrencyPair(
  base: string,
  quote: string,
  token: string,
): Promise<any> {
  const apiRequestContext = await createApiRequestContext(
    token,
    config.backofficeBaseUrl,
  );

  return await apiRequestContext.delete(
    `/api/v1/market-admin/pairs/${base}/${quote}`,
  );
}
