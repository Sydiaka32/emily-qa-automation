import { APIRequestContext } from "@playwright/test";

export interface GetMessagesConfig {
  request: APIRequestContext;
  apiBaseUrl: string;
  accessToken: string;
  search: string;
  page?: number;
  size?: number;
}
