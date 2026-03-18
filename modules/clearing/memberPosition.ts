import { Country } from "../core/country";
import { Contact } from "../core/contact";
import { Region } from "../core/region";
import { Tariff } from "../core/tariff";
import { LedgerSettings } from "./ledgerSettings";

export interface MemberPosition {
  xmi: string;
  name: string;
  country: Country;
  status: string;
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
