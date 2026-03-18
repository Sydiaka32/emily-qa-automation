export const SettlementTypes = {
  dns: "DNS",
  rtgs: "RTGS",
} as const;

export type SettlementTypes =
  (typeof SettlementTypes)[keyof typeof SettlementTypes];
