export const SettlementAssetTypes = {
  direct: "DIRECT",
  indirect: "INDIRECT",
  none: "NONE",
  custodian: "CUSTODIAN",
  network: "NETWORK",
} as const;

export type SettlementAssetType =
  (typeof SettlementAssetTypes)[keyof typeof SettlementAssetTypes];
