export interface CreditTransfer {
  reference_id: string;
  type: string;
  status: string;
  pending_status: string | null;
  debtor: {
    xmi: string;
    name: string;
  };
  creditor: {
    xmi: string;
    name: string;
  };
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  settled_at: string | null;
  settlement_type: string;
  tx_id: string;
  end_to_end_id: string;
  instr_id: string;
  uetr: string;
  allow_cancel: boolean;
  allow_recall: boolean;
  allow_return: boolean;
}
