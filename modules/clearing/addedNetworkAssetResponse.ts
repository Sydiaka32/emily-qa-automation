export interface AddedNetworkAssetResponse {
  asset: {
    code: string;
    name: string;
    type: string;
    precision: number;
  };
  settlement_asset_type: string;
  parent: null;
  custodian: {
    xmi: string;
    name: string;
  };
  settlement_system: {
    code: string;
    name: string;
    rtgs_support: string;
    adapter: string;
  };
  account_number: string;
  external_account_number: string;
  domestic: boolean;
}
