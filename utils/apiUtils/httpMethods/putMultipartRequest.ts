// @utils/apiUtils.ts
import { APIResponse } from "@playwright/test";

/**
 * Make a PUT request with multipart form data
 */
export async function putMultipartRequest(
  url: string,
  token: string,
  baseUrl: string,
  formData: any,
  request: any, // Pass the request fixture from test context
): Promise<{ response: APIResponse; body: any }> {
  const response = await request.put(`${baseUrl}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    multipart: formData,
  });

  const body = await response.json();
  return { response, body };
}

// Or if you're using the global request context, use it like this:
export async function putMultipartRequestGlobal(
  url: string,
  token: string,
  baseUrl: string,
  formData: any,
): Promise<{ response: APIResponse; body: any }> {
  // Import request here or make it available globally
  const { request } = require("@playwright/test");

  const response = await request.put(`${baseUrl}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    multipart: formData,
  });

  const body = await response.json();
  return { response, body };
}
