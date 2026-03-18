import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

/**
 * POST request helper
 */
export async function postRequest(
  endpoint: string,
  payload: any,
  token: string,
  baseUrl: string = config.apiBaseUrl,
): Promise<{ response: any; body: any }> {
  const apiRequestContext = await createApiRequestContext(token, baseUrl, {
    "Content-Type": "application/json",
  });

  const response = await apiRequestContext.post(endpoint, {
    data: payload,
  });

  let body;
  try {
    body = await response.json();
  } catch (e) {
    // If response is not JSON, get text instead
    const text = await response.text();
    body = text || null;
  }

  return {
    response,
    body,
  };
}
