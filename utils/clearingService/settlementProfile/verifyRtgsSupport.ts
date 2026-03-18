import { expect } from "@playwright/test";

/**
 * Check if asset supports RTGS
 */
export function verifyRTGSSupport(settlementProfile: any): void {
  const rtgsSupport = settlementProfile.settlement_system.rtgs_support;
  expect(rtgsSupport).toBe("YES");
  console.log(`Asset ${settlementProfile.asset.code} supports RTGS`);
}
