export interface AddedIndirectAssetResponse {
  asset: {
    code: string;
    name: string;
    type: string;
    precision: number;
  };
  settlement_asset_type: string;
  parent: {
    xmi: string;
    name: string;
  };
  custodian: {
    xmi: string;
    name: string;
  } | null; // Allow null
  settlement_system: {
    code: string;
    name: string;
    rtgs_support: string;
    adapter: string;
  } | null; // Allow null
  account_number: string | null;
  external_account_number: string | null;
  domestic: boolean;
}
