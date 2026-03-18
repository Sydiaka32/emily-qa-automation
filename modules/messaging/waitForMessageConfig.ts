export interface WaitForMessageConfig {
  request: any;
  apiBaseUrl: string;
  accessToken: string;
  search: string;
  expectedSenderXmi: string;
  expectedReceiverXmi: string;
  maxAttempts?: number;
  delayMs?: number;
}
