import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

export async function getPublicCurrentMember(
  apiKey: string,
): Promise<{ response: any; body: any }> {
  const apiRequestContext = await createApiRequestContext(
    undefined,
    config.publicBaseUrl,
    {
      "X-API-KEY": apiKey,
    },
  );

  const response = await apiRequestContext.get("/api/v1/core/members");
  const body = await response.json();
  return { response, body };
}
