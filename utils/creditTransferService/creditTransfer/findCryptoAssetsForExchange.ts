/**
 * Find cryptocurrency assets suitable for exchange where:
 * - Sender has the asset as INDIRECT (so they can exchange for it)
 * - Receiver has the asset in any type (they just need to be able to receive it)
 * - Excludes the sender's domestic currency
 */
export function findCryptoAssetsForExchange(
  senderPositions: any[],
  receiverPositions: any[],
  cryptoAssets: string[],
  excludeCurrency?: string,
): string[] {
  console.log("=== DEBUG: Starting findCryptoAssetsForExchange ===");

  // Extract asset codes - sender must have INDIRECT, receiver can have any type
  const senderIndirectAssets = senderPositions
    .filter((position) => position.settlement_type === "INDIRECT")
    .map((position) => position.code);

  const receiverAnyAssets = receiverPositions.map((position) => position.code);

  console.log(`Sender INDIRECT assets: [${senderIndirectAssets.join(", ")}]`);
  console.log(`Receiver assets (any type): [${receiverAnyAssets.join(", ")}]`);
  console.log(`Available crypto assets: [${cryptoAssets.join(", ")}]`);
  console.log(`Excluding currency: ${excludeCurrency}`);

  // Find common crypto assets where sender has INDIRECT and receiver has any type
  const exchangeCryptoAssets = senderIndirectAssets.filter((asset) => {
    const isCrypto = cryptoAssets.includes(asset);
    const isCommon = receiverAnyAssets.includes(asset);
    const isNotExcluded = asset !== excludeCurrency;

    console.log(
      `Asset ${asset}: crypto=${isCrypto}, common=${isCommon}, notExcluded=${isNotExcluded}`,
    );

    return isCrypto && isCommon && isNotExcluded;
  });

  console.log(
    `Final crypto assets suitable for exchange: [${exchangeCryptoAssets.join(", ")}]`,
  );

  return exchangeCryptoAssets;
}
