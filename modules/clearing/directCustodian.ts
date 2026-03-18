import { SettlementParty } from "./settlementParty";
import { SettlementSystem } from "./settlementSystem";

export interface DirectCustodian {
  member: SettlementParty;
  custodian: SettlementParty | null;
  settlement_system: SettlementSystem;
}
