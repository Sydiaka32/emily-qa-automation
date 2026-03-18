import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

/**
 * GET request helper for binary downloads
 */
export async function getRequestBinary(
  endpoint: string,
  token: string,
  baseUrl: string = config.apiBaseUrl,
): Promise<{ response: any; body: Buffer }> {
  // No Content-Type header for binary downloads
  const apiRequestContext = await createApiRequestContext(token, baseUrl);

  const response = await apiRequestContext.get(endpoint);
  const body = await response.body();

  return {
    response,
    body,
  };
}
