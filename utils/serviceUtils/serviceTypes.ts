export interface Service {
  code: string;
  name: string;
  group: string;
  status: "active" | "inactive";
}

// Service codes mapping for better type safety
export const ServiceCodes = {
  TRADER: "trd",
  LIQUIDITY_PROVIDER: "lp",
  CLEARING: "clr",
  CREDIT_TRANSFER: "ct",
  SECURE_MESSAGING: "sm"
} as const;

export type ServiceCode = typeof ServiceCodes[keyof typeof ServiceCodes];