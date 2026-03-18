import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

export async function getOrderByOuid(
  ouid: string,
  token: string,
  page: number = 0,
  size: number = 10,
): Promise<{ response: any; body: any }> {
  const apiRequestContext = await createApiRequestContext(
    token,
    config.apiBaseUrl,
  );
  const response = await apiRequestContext.get(
    `/api/v1/market/orders?ouid=${ouid}&page=${page}&size=${size}`,
  );
  const body = await response.json();
  return { response, body };
}
