export interface ExchangeCreditTransferResult {
  referenceId: string;
  validationId: string;
  amount: number;
  currency: string;
  exchangeAsset: string;
  status: string;
  senderCT: any;
  receiverCT?: any;
}
