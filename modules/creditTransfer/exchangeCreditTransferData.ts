import { CreditTransferData } from "./creditTransferData";

export interface ExchangeCreditTransferData extends CreditTransferData {
  exchangeAsset: string;
  availableBalance: number;
  exchangeNeeded: number;
  makerToken: string;
}
