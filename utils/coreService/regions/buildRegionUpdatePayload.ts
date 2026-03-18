/**
 * Build payload for updating region limits
 */
export function buildRegionUpdatePayload(
  currentRegionDetails: any,
  newMaxTransactionAmount: number,
): any {
  return {
    asset: currentRegionDetails.asset,
    allowed_currencies: currentRegionDetails.allowed_currencies,
    limits: {
      ...currentRegionDetails.limits,
      max_transaction_amount_flat: newMaxTransactionAmount.toString(),
    },
    name: currentRegionDetails.name,
  };
}
