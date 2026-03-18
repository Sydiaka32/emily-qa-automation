import { Country } from "./country";
import { Region } from "./region";
import { Contact } from "./contact";


export interface MemberResponse {
  xmi: string;
  name: string;
  country: Country;
  status: string;
  region: Region;
  address: string;
  domestic_currency: string;
  tax_ref: string;
  main_contact: Contact;
  alt_contact: Contact;
  branch_name: string;
}


