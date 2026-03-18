export interface CreditTransferResult {
  referenceId: string;
  validationId: string;
  amount: number;
  currency: string;
  status: string;
  senderCT: any;
  receiverCT?: any;
}
