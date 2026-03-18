export interface CompletedCreditTransferSetup {
  senderToken: string;
  receiverToken: string;
  operatorToken: string;
  creditTransferReferenceId: string;
  completedCT: any;
  senderDomesticCurrency: string;
  ctAmount: number;
  receiverXmi: string;
  originalTxId: string;
}
