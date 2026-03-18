export interface EodCycle {
  id: string;
  business_day: string;
  created_at: string;
  closed_at: string | null;
  status: string;
  records: number;
}

export interface EodCyclesResponse {
  total_pages: number;
  total_elements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
  content: EodCycle[];
}
