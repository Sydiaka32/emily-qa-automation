import { expect } from "@playwright/test";

/**
 * Verify CT amount is within region flat limits
 */
export function verifyCTAmountWithinRegionLimits(
  ctAmount: number,
  regionLimits: any,
): void {
  const minFlat = regionLimits.min_transaction_amount_flat;
  const maxFlat = regionLimits.max_transaction_amount_flat;

  expect(ctAmount).toBeGreaterThanOrEqual(minFlat);
  expect(ctAmount).toBeLessThanOrEqual(maxFlat);

  console.log(
    `CT amount ${ctAmount} is within region limits: ${minFlat} - ${maxFlat}`,
  );
}
