import { APIRequestContext } from "@playwright/test";

export interface GetCreditTransfersConfig {
  request: APIRequestContext;
  apiBaseUrl: string;
  accessToken: string;
  search: string;
  page?: number;
  size?: number;
}
