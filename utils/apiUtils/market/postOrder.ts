import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

export async function postOrder(
  url: string,
  data: any,
  token: string,
): Promise<{ response: any; body: any }> {
  const apiRequestContext = await createApiRequestContext(
    token,
    config.apiBaseUrl,
    {
      "Content-Type": "application/json",
    },
  );
  const response = await apiRequestContext.post(url, { data });
  const body = await response.json();
  return { response, body };
}
