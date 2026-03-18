import { config } from "../../../test.config";
import { createApiRequestContext } from "@utils/apiUtils";

/**
 * DELETE request helper
 */
export async function deleteRequest(
  endpoint: string,
  token: string,
  baseUrl: string = config.apiBaseUrl,
): Promise<{ response: any; body: any }> {
  const apiRequestContext = await createApiRequestContext(token, baseUrl, {
    "Content-Type": "application/json",
  });

  const response = await apiRequestContext.delete(endpoint);
  let body: any;

  try {
    // Try to get the response text first
    const responseText = await response.text();

    if (responseText && responseText.trim().length > 0) {
      try {
        // Try to parse as JSON if there's content
        body = JSON.parse(responseText);
      } catch (parseError) {
        // If not valid JSON, return as text
        body = responseText;
      }
    } else {
      // Empty response - set body to empty object or null
      body = {};
    }
  } catch (e) {
    // If response.text() fails, set body to empty
    body = {};
  }

  return {
    response,
    body,
  };
}
