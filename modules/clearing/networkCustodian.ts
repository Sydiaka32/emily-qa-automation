import { SettlementParty } from "./settlementParty";
import { SettlementSystem } from "./settlementSystem";

export interface NetworkCustodian {
  member: SettlementParty;
  custodian: SettlementParty | null;
  settlement_system: SettlementSystem;
}
