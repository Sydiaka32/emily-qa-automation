import { TransactionParty } from "./transactionParty";

export interface Transaction {
  reference_id: string;
  type: string;
  status: string;
  debtor: TransactionParty;
  creditor: TransactionParty;
  amount: number;
  currency: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string;
  settled_at: string | null;
  settlement_type: string | null;
}
