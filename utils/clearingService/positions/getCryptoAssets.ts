import { getAssets } from "./getAssets";

/**
 * Get all cryptocurrency assets from the ledger
 */
export async function getCryptoAssets(token: string): Promise<string[]> {
  const assetsArray = await getAssets(token);

  // Filter for cryptocurrency assets
  const cryptoAssets = assetsArray
    .filter((asset: any) => {
      const isCrypto = asset.type === "crypto";
      if (isCrypto) {
        console.log(`Found crypto asset: ${asset.code} (${asset.name})`);
      }
      return isCrypto;
    })
    .map((asset: any) => asset.code);

  console.log(`Available crypto assets: [${cryptoAssets.join(", ")}]`);

  if (cryptoAssets.length === 0) {
    console.warn("No cryptocurrency assets found in the response");

    // Log all available asset types for debugging
    const assetTypes = assetsArray.reduce((acc: any, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {});
    console.log("Available asset types:", assetTypes);
  }

  return cryptoAssets;
}
