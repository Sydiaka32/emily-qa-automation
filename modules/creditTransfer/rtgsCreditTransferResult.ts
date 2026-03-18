export interface RTGSCreditTransferResult {
  referenceId: string;
  validationId: string;
  amount: number;
  currency: string;
  status: string;
  senderCT: any;
  receiverCT?: any;
}
