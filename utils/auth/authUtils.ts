import { request } from "@playwright/test";
import { TokenResponse, AuthConfig } from "./types";

export async function authenticateUser(
  username: string,
  password: string,
  authConfig: AuthConfig
): Promise<string> {
  const apiRequestContext = await request.newContext({
    baseURL: authConfig.baseUrl,
    extraHTTPHeaders: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const formData = new URLSearchParams();
  formData.append("client_id", authConfig.clientId);
  formData.append("username", username);
  formData.append("password", password);
  formData.append("grant_type", "password");

  const response = await apiRequestContext.post(
    `/realms/${authConfig.realm}/protocol/openid-connect/token`,
    {
      data: formData.toString(),
    },
  );

  if (response.status() !== 200) {
    throw new Error(`Auth request failed with status ${response.status()}: ${await response.text()}`);
  }

  const json: TokenResponse = await response.json();

  if (!json.access_token) {
    throw new Error("Access token not found in response");
  }

  return json.access_token;
}