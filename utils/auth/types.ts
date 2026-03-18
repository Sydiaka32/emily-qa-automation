export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}

export interface AuthConfig {
  clientId: string;
  realm: string;
  baseUrl: string;
}
