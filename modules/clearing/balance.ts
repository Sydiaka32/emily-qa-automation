export interface Balance {
  code: string; // Currency code like 'SAR', 'BRL'
  name: string;
  account_number: string;
  settlement_type: string;
  clr_amount: number; // Clear balance
  reserved: number; // Reserved balance (this is RSV)
  set_amount: number;
}
