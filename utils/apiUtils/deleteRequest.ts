import { config } from "../../test.config";
import { createApiRequestContext } from "@utils/apiUtils/requestContext";

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
    // First, get the response as text to handle empty responses
    const responseText = await response.text();

    // Try to parse as JSON only if there's content
    if (responseText && responseText.trim().length > 0) {
      try {
        body = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, return the text as body
        body = responseText;
      }
    } else {
      // Empty response - return null
      body = null;
    }
  } catch (textError) {
    // If even text() fails, return null
    body = null;
  }

  return {
    response,
    body,
  };
}
