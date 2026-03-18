export const OrderDirection = {
  bid: "BID",
  ask: "ASK",
} as const;

export type OrderDirection =
  (typeof OrderDirection)[keyof typeof OrderDirection];
