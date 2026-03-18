import { createApiRequestContext } from "@utils/apiUtils";

/**
 * PUT request helper
 */
export async function putRequest(
  endpoint: string,
  token: string,
  baseUrl: string, // Make baseUrl required, no default
  payload: any,
): Promise<{ response: any; body: any; error?: string }> {
  const apiRequestContext = await createApiRequestContext(token, baseUrl, {
    "Content-Type": "application/json",
  });

  const response = await apiRequestContext.put(endpoint, {
    data: payload,
  });

  let body;
  let error;

  try {
    const responseText = await response.text();
    if (responseText && responseText.trim().length > 0) {
      try {
        body = JSON.parse(responseText);
      } catch (parseError) {
        body = responseText;
        const message =
          parseError instanceof Error ? parseError.message : String(parseError);
        error = `JSON parse error: ${message}. Response: ${responseText.substring(0, 100)}`;
      }
    } else {
      body = {};
    }
  } catch (textError: unknown) {
    const message =
      textError instanceof Error ? textError.message : String(textError);
    body = {};
    error = `Failed to get response text: ${message}`;
  }

  return {
    response,
    body,
    error,
  };
}
