import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

export async function getTrades(
  page: number = 0,
  size: number = 10,
  token: string,
): Promise<{ response: any; body: any }> {
  const apiRequestContext = await createApiRequestContext(
    token,
    config.apiBaseUrl,
  );

  const response = await apiRequestContext.get(
    `/api/v1/market/trades?page=${page}&size=${size}`,
  );
  const body = await response.json();
  return { response, body };
}
