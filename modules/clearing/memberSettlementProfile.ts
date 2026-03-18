import { Country } from "../core/country";
import { Contact } from "../core/contact";
import { Region } from "../core/region";
import { Tariff } from "../core/tariff";

export interface MemberSettlementProfile {
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
}

export interface MemberSettlementProfilesResponse {
  total_pages: number;
  total_elements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
  content: MemberSettlementProfile[];
}
