export interface WaitForCreditTransferConfig {
  request: any;
  apiBaseUrl: string;
  accessToken: string;
  search: string;
  expectedStatus?: string;
  maxAttempts?: number;
  delayMs?: number;
}
