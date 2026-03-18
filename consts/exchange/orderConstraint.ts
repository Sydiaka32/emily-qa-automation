export const OrderConstraint = {
  gtc: "GTC",
  gfd: "GFD",
  ioc: "IOC",
  fok: "FOK",
} as const;

export type OrderConstraint =
  (typeof OrderConstraint)[keyof typeof OrderConstraint];
