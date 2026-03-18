export const RestrictionReasonCodes = {
  manual: "manual",
  sanction: "sanction",
} as const;

export type RestrictionReasonCodes =
  (typeof RestrictionReasonCodes)[keyof typeof RestrictionReasonCodes];
