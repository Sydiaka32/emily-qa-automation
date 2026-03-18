import { APIResponse } from "@playwright/test";

/**
 * Make a POST request with multipart form data
 */
export async function postMultipartRequest(
  url: string,
  token: string,
  baseUrl: string,
  formData: any,
  requestContext: any,
): Promise<{ response: APIResponse; body: any }> {
  const response = await requestContext.post(`${baseUrl}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    multipart: formData,
  });

  const body = await response.json();
  return { response, body };
}
