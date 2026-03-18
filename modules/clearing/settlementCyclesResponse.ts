import { SettlementCycle } from "./settlementCycle";

export interface SettlementCyclesResponse {
  total_pages: number;
  total_elements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
  content: SettlementCycle[];
}
