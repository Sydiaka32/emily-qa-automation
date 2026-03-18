import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

export async function getRequest(
  endpoint: string,
  token: string,
  baseUrl: string = config.apiBaseUrl,
  params?: any, // Add optional params for query parameters
): Promise<{ response: any; body: any }> {
  const apiRequestContext = await createApiRequestContext(token, baseUrl, {
    "Content-Type": "application/json",
  });

  // Add params to the request if provided
  const requestOptions: any = {};
  if (params) {
    requestOptions.params = params;
  }

  const response = await apiRequestContext.get(endpoint, requestOptions);
  let body: any;
  const contentType = response.headers()["content-type"];

  if (contentType && contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text(); // fallback for plain text responses
  }
  return {
    response,
    body,
  };
}
