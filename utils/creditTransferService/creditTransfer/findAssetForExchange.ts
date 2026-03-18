/**
 * Find common assets suitable for exchange where:
 * - Sender has the asset as INDIRECT (so they can exchange for it)
 * - Receiver has the asset in any type (they just need to be able to receive it)
 * - Excludes the sender's domestic currency
 */
export function findAssetsForExchange(
  senderPositions: any[],
  receiverPositions: any[],
  excludeCurrency?: string,
): string[] {
  console.log("=== DEBUG: Starting findAssetsForExchange ===");

  // Extract asset codes - sender must have INDIRECT, receiver can have any type
  // NOTE: Using 'settlement_type' and 'code' fields based on the actual API response
  const senderIndirectAssets = senderPositions
    .filter((position) => {
      const isIndirect = position.settlement_type === "INDIRECT";
      console.log(
        `Sender asset ${position.code}: settlement_type=${position.settlement_type}, indirect=${isIndirect}`,
      );
      return isIndirect;
    })
    .map((position) => position.code);

  const receiverAnyAssets = receiverPositions.map((position) => {
    console.log(
      `Receiver asset ${position.code}: settlement_type=${position.settlement_type}`,
    );
    return position.code;
  });

  console.log(`Sender INDIRECT assets: [${senderIndirectAssets.join(", ")}]`);
  console.log(`Receiver assets (any type): [${receiverAnyAssets.join(", ")}]`);
  console.log(`Excluding currency: ${excludeCurrency}`);

  // Find common assets where sender has INDIRECT and receiver has any type
  const exchangeAssets = senderIndirectAssets.filter((asset) => {
    const isCommon = receiverAnyAssets.includes(asset);
    const isNotExcluded = asset !== excludeCurrency;
    console.log(
      `Asset ${asset}: common=${isCommon}, notExcluded=${isNotExcluded}`,
    );
    return isCommon && isNotExcluded;
  });

  console.log(
    `Final assets suitable for exchange: [${exchangeAssets.join(", ")}]`,
  );

  return exchangeAssets;
}
