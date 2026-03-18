/**
 * Calculate safe CT amount - always use 10-5000 range
 */
export function calculateSafeCTAmountWithRegionLimits(
  creditLimitData: any,
  regionLimits: any,
): number {
  const currentLimit = creditLimitData.global_current_limit;
  const regionMin = regionLimits.min_transaction_amount_flat;
  const regionMax = regionLimits.max_transaction_amount_flat;

  console.log(`\n=== CT Amount Calculation ===`);
  console.log(`Credit Limit: ${currentLimit}`);
  console.log(`Region Limits: ${regionMin} - ${regionMax}`);

  // Our guaranteed safe range
  const safeMin = 10;
  const safeMax = 5000;

  // Verify that 10-5000 is within credit and region limits
  if (safeMin < regionMin) {
    throw new Error(
      `Preferred minimum ${safeMin} is below region minimum ${regionMin}`,
    );
  }

  if (safeMax > regionMax) {
    throw new Error(
      `Preferred maximum ${safeMax} is above region maximum ${regionMax}`,
    );
  }

  if (safeMax > currentLimit) {
    throw new Error(
      `Preferred maximum ${safeMax} is above credit limit ${currentLimit}`,
    );
  }

  // Generate random amount within 10-5000
  const randomAmount = safeMin + Math.random() * (safeMax - safeMin);
  const ctAmount = Math.round(randomAmount * 100) / 100;

  console.log(`Using guaranteed safe range: 10-5000`);
  console.log(`Generated CT Amount: ${ctAmount}`);
  console.log(`=============================\n`);

  return ctAmount;
}
