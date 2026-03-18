export const OrderType = {
  bid: "BID",
  ask: "ASK",
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];
