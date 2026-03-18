export interface SettledTransactionResult {
  referenceId: string;
  ctAmount: number;
  domesticCurrency: string;
  senderTransaction: any;
  receiverTransaction: any;
  senderToken: string;
  receiverToken: string;
  operatorToken: string;
}
