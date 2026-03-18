export interface SettledRTGSCreditTransferSetup {
  senderToken: string;
  receiverToken: string;
  operatorToken: string;
  creditTransferReferenceId: string;
  settledCT: any;
  senderDomesticCurrency: string;
  ctAmount: number;
  receiverXmi: string;
  originalTxId: string;
}
