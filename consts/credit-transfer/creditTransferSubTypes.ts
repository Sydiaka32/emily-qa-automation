export const CreditTransferSubTypes = {
  cct: "cct",
  fict: "fict",
  stp: "stp",
} as const;

export type CreditTransferTypes =
  (typeof CreditTransferSubTypes)[keyof typeof CreditTransferSubTypes];
