export interface SettlementSystem {
  code: string;
  name: string;
  rtgs_support: string;
  adapter: string;
}

export interface SettlementSystemsResponse {
  total_pages: number;
  total_elements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
  content: SettlementSystem[];
}
