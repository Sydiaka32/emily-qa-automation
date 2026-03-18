export interface AddedNoneAssetResponse {
  asset: {
    code: string;
    name: string;
    type: string;
    precision: number;
  };
  settlement_asset_type: string;
  parent: string | null;
  custodian: {
    xmi: string;
    name: string;
  } | null;
  settlement_system: {
    code: string;
    name: string;
    rtgs_support: string;
    adapter: string;
  };
  account_number: string | null;
  external_account_number: string | null;
  domestic: boolean;
}
