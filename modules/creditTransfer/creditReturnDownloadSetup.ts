export interface CreditReturnDownloadTestSetup {
  receiverToken: string;
  operatorToken: string;
  creditTransferReferenceId: string;
  senderDomesticCurrency: string;
  ctAmount: number;
  receiverXmi: string;
  originalTxId: string;
  creditReturnReferenceId: string;
  creditReturn: any;
}
