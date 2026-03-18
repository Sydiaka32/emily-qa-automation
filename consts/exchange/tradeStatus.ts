export const TradeStatus = {
  completed: "COMPLETED",
  failed: "FAILED",
} as const;

export type TradeStatus = (typeof TradeStatus)[keyof typeof TradeStatus];
