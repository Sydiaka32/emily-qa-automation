/**
 * Get available balance for a specific asset from positions
 */
export function getAvailableBalance(
  positions: any[],
  assetCode: string,
): number {
  // Find position by code (not asset_code) and use clr_amount for available balance
  const position = positions.find((pos) => pos.code === assetCode);

  if (!position) {
    throw new Error(`No position found for asset: ${assetCode}`);
  }

  const availableBalance = position.clr_amount || 0;
  console.log(`Available balance for ${assetCode}: ${availableBalance}`);

  return availableBalance;
}
