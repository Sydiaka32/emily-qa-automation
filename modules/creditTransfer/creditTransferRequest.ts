export interface CreditTransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
}
