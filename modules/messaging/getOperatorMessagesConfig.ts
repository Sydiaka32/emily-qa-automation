import { APIRequestContext } from "@playwright/test";

export interface GetOperatorMessagesConfig {
  request: APIRequestContext;
  backofficeBaseUrl: string;
  accessToken: string;
  search?: string;
  page?: number;
  size?: number;
}
