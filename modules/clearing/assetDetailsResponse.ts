export interface AssetDetailsResponse {
  asset: {
    code: string;
    name: string;
  };
  settlement_asset_type: string;
  parent: any;
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
  domestic: boolean;
  account_number: string;
  external_account_number: string;
}
