export const CreditTransferStatuses = {
  completed: "COMPLETED",
  settled: "SETTLED",
  pending: "PENDING",
  cancelled: "CANCELLED",
} as const;

export type CreditTransferStatuses =
  (typeof CreditTransferStatuses)[keyof typeof CreditTransferStatuses];
