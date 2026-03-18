import { SettlementAssetType } from "../../consts/clearing/settlementAssetTypes";

export interface AddNetworkAssetPayload {
  asset: string;
  asset_type: SettlementAssetType;
  custodian_xmi: string;
  account_number: string;
  external_account_number: string;
}
