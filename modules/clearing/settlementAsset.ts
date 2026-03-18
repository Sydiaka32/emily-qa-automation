import { Asset } from "./asset";
import { SettlementParty } from "./settlementParty";
import { SettlementSystem } from "./settlementSystem";

export interface SettlementAsset {
  asset: Asset;
  settlement_asset_type: string;
  parent: SettlementParty | null;
  custodian: SettlementParty | null;
  settlement_system: SettlementSystem | null;
  account_number: string | null;
  external_account_number: string | null;
  domestic: boolean;
}
