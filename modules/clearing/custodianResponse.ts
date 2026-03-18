export interface CustodianResponse {
  member: {
    xmi: string;
    name: string;
  };
  custodian: null;
  settlement_system: {
    code: string;
    name: string;
    rtgs_support: string;
    adapter: string;
  };
}
