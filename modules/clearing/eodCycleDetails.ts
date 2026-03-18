export interface EodCycleDetails {
  id: string;
  business_day: string;
  created_at: string;
  closed_at: string | null;
  status: string;
  records: number;
}
