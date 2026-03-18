export interface Country {
  code: string;
  name: string;
}

export interface Contact {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

export interface Region {
  code: string;
  name: string;
}

export interface Tariff {
  code: string;
  name: string;
}

export interface LedgerSettings {
  collateral_amount: number;
  global_base_limit: number;
  global_current_limit: number;
  clr_positions_amount: number;
  reserve_positions_amount: number;
  set_positions_amount: number;
  cash_positions_amount: number;
}

export interface Member {
  xmi: string;
  name: string;
  country: Country;
  status: string;
  kyb_status: string | null;
  branch_name: string;
  tax_ref: string;
  main_contact: Contact;
  alt_contact: Contact;
  language: string | null;
  address: string;
  region: Region;
  tariff: Tariff | null;
  asset: string;
  ledger_settings: LedgerSettings;
}

export interface MembersResponse {
  total_pages: number;
  total_elements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
  content: Member[];
}
