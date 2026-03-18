export const CreditTransferTypes = {
  creditReturn: "CREDIT_RETURN",
  creditTransfer: "CREDIT_TRANSFER",
} as const;

export type CreditTransferTypes =
  (typeof CreditTransferTypes)[keyof typeof CreditTransferTypes];
