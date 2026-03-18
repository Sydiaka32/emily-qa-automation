import { SettlementParty } from "./settlementParty";
import { SettlementSystem } from "./settlementSystem";

export interface SettlementCycle {
  settlement_cycle_id: string;
  created_at: string;
  completed_at: string;
  custodian: SettlementParty;
  system: SettlementSystem;
  type: string;
  status: string;
  asset: string;
}
