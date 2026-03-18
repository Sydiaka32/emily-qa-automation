export const OrderStatuses = {
  open: "NEW",
  filled: "FILLED",
  partiallyFilled: "PARTIALLY_FILLED",
  partiallyCancelled: "PARTIALLY_CANCELLED",
  cancelled: "CANCELLED",
  requested: "REQUIRED",
} as const;

export type OrderStatuses = (typeof OrderStatuses)[keyof typeof OrderStatuses];
