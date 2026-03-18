import { SettlementProfileMember } from "./settlementProfileMember";

export interface AllSettlementProfilesResponse {
  total_pages: number;
  total_elements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
  content: SettlementProfileMember[];
}
