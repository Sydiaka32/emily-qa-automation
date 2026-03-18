import { APIRequestContext } from "@playwright/test";

export interface SendIsoMessageConfig {
  request: APIRequestContext;
  restApiUrl: string;
  apiKey: string;
  xmlMessage: string;
}
