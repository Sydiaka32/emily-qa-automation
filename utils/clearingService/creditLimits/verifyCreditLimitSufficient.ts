import { expect } from "@playwright/test";

/**
 * Verify credit limit is sufficient for CT amount
 */
export function verifyCreditLimitSufficient(
  creditLimitData: any,
  ctAmount: number,
): void {
  const currentLimit = creditLimitData.global_current_limit;

  expect(currentLimit).toBeGreaterThan(ctAmount);
  console.log(`Credit limit sufficient: ${currentLimit} > ${ctAmount}`);

  // Optional: Also check if we have enough in the specific asset if needed
  const domesticCurrency = creditLimitData.asset;
  const assetLimit = creditLimitData.asset_credit_limits.find(
    (limit: any) => limit.asset_code === domesticCurrency,
  );

  if (assetLimit) {
    console.log(
      `Asset ${domesticCurrency} limit: ${assetLimit.asset_current_limit}`,
    );
  }
}
