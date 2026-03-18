import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

export async function getFeed(): Promise<{ response: any; body: any }> {
  const apiRequestContext = await createApiRequestContext(
    undefined,
    config.publicBaseUrl,
    {
      "X-API-KEY": config.publicApiKey,
    },
  );

  const response = await apiRequestContext.get("/api/v1/feed");
  const body = await response.json();
  return { response, body };
}
