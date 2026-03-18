export const RecallStatuses = {
  approved: "APPROVED",
  pending: "PENDING",
  declined: "DECLINED",
} as const;

export type RecallStatuses =
  (typeof RecallStatuses)[keyof typeof RecallStatuses];
