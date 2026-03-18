import { SettlementParty } from "./settlementParty";
import { SettlementSystem } from "./settlementSystem";

export interface IndirectCustodian {
  member: SettlementParty;
  custodian: SettlementParty;
  settlement_system: SettlementSystem;
}
