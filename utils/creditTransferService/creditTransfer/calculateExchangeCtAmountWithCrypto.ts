import { getMemberPositions } from "@utils/clearingService/positions/getMemberPositions";
import { findAssetsForExchange } from "./findAssetForExchange";
import { getAvailableBalance } from "@utils/clearingService/positions/getAvailableBalance";
import { getRegionLimitsForMember } from "@utils/coreService/regions/getRegionLimits";
import { getCreditLimit } from "@utils/clearingService/creditLimits/getCreditLimit";
import { extractDomesticCurrency } from "@utils/coreService/extractDomesticCurrency";
import { config } from "../../../test.config";
import { getExchangeRate } from "@utils/exchangeService/getExchangeRate";

export async function calculateExchangeCtAmountCrypto(
  memberInfo: any,
  operatorToken: string,
  senderToken: string,
  allAssets: any[],
): Promise<{
  ctAmount: number;
  exchangeAsset: string;
  availableBalance: number;
}> {
  console.log("Calculating crypto exchange credit transfer amount...");

  const domesticCurrency = extractDomesticCurrency(memberInfo);
  console.log(`Domestic currency: ${domesticCurrency}`);

  // Get member positions for both members
  console.log("Getting member positions for both members...");
  const [senderPositions, receiverPositions] = await Promise.all([
    getMemberPositions(memberInfo.xmi, operatorToken),
    getMemberPositions(config.receiverXmi, operatorToken),
  ]);

  // Find assets suitable for exchange (sender INDIRECT, receiver any type)
  console.log("Finding assets suitable for exchange...");
  const commonAssets = findAssetsForExchange(
    senderPositions,
    receiverPositions,
    domesticCurrency, // Exclude domestic currency
  );

  if (commonAssets.length === 0) {
    throw new Error("No suitable assets found for exchange");
  }

  // Filter common assets to only include cryptocurrencies
  const cryptoAssets = allAssets
    .filter((asset) => asset.type === "crypto")
    .map((asset) => asset.code);

  console.log(`Available crypto assets: [${cryptoAssets.join(", ")}]`);

  // Find common assets that are also cryptocurrencies
  const commonCryptoAssets = commonAssets.filter((asset) =>
    cryptoAssets.includes(asset),
  );

  if (commonCryptoAssets.length === 0) {
    throw new Error(
      `No cryptocurrency assets found for exchange. Common assets: [${commonAssets.join(", ")}], Crypto assets: [${cryptoAssets.join(", ")}]`,
    );
  }

  // Use the first common crypto asset
  const exchangeAsset = commonCryptoAssets[0];
  const assetInfo = allAssets.find((asset) => asset.code === exchangeAsset);

  console.log(
    `Selected crypto exchange asset: ${exchangeAsset} (${assetInfo.type})`,
  );
  console.log(
    `Asset details: ${assetInfo.name}, precision: ${assetInfo.precision}`,
  );

  // Get available balance for the crypto exchange asset
  const availableBalance = getAvailableBalance(senderPositions, exchangeAsset);
  console.log(`Available balance for ${exchangeAsset}: ${availableBalance}`);

  // Get exchange rate between crypto asset and domestic currency
  console.log(
    `Getting exchange rate for ${exchangeAsset}/${domesticCurrency}...`,
  );
  const exchangeRate = await getExchangeRate(
    operatorToken,
    exchangeAsset,
    domesticCurrency,
  );

  // Based on the endpoint response format, the rate represents:
  // 1 crypto_asset = X domestic_asset (e.g., 1 BTC = 342,472 SAR)
  console.log(
    `Exchange rate: 1 ${exchangeAsset} = ${exchangeRate} ${domesticCurrency}`,
  );

  // Get credit limit and region limits
  console.log("Getting limits for exchange amount calculation...");
  const [creditLimitData, regionLimits] = await Promise.all([
    getCreditLimit(senderToken),
    getRegionLimitsForMember(memberInfo, operatorToken),
  ]);

  const regionMin = regionLimits.min_transaction_amount_flat;
  const regionMax = regionLimits.max_transaction_amount_flat;
  const creditLimit = creditLimitData.global_current_limit;

  console.log(`\n=== Crypto Exchange CT Amount Calculation ===`);
  console.log(`Available balance in ${exchangeAsset}: ${availableBalance}`);
  console.log(
    `Region limits in ${domesticCurrency}: ${regionMin} - ${regionMax}`,
  );
  console.log(`Credit limit in ${domesticCurrency}: ${creditLimit}`);
  console.log(
    `Exchange rate: 1 ${exchangeAsset} = ${exchangeRate} ${domesticCurrency}`,
  );

  // Convert limits to crypto currency using exchange rate
  // Since 1 crypto = X domestic, to get domestic amount in crypto: domestic_amount / exchangeRate
  const regionMinInCrypto = regionMin / exchangeRate;
  const regionMaxInCrypto = regionMax / exchangeRate;
  const creditLimitInCrypto = creditLimit / exchangeRate;

  console.log(
    `Region limits in ${exchangeAsset}: ${regionMinInCrypto.toFixed(assetInfo.precision)} - ${regionMaxInCrypto.toFixed(assetInfo.precision)}`,
  );
  console.log(
    `Credit limit in ${exchangeAsset}: ${creditLimitInCrypto.toFixed(assetInfo.precision)}`,
  );

  // Calculate the minimum amount needed to trigger exchange
  const smallestIncrement = 1 / Math.pow(10, assetInfo.precision);
  let minAmountRequired = Math.max(
    availableBalance + smallestIncrement, // Smallest increment above balance
    regionMinInCrypto,
  );

  // The maximum amount is constrained by region max and credit limit (in crypto)
  const maxAmountAllowed = Math.min(regionMaxInCrypto, creditLimitInCrypto);

  console.log(
    `Initial range: ${minAmountRequired.toFixed(assetInfo.precision)} - ${maxAmountAllowed.toFixed(assetInfo.precision)} ${exchangeAsset}`,
  );

  // Final validation
  if (minAmountRequired > maxAmountAllowed) {
    // Last resort: use smallest amount above balance
    minAmountRequired = availableBalance + smallestIncrement;

    if (minAmountRequired > maxAmountAllowed) {
      throw new Error(
        `Cannot find valid exchange amount:\n` +
          ` - Available balance: ${availableBalance} ${exchangeAsset}\n` +
          ` - Minimum required: ${minAmountRequired.toFixed(assetInfo.precision)} ${exchangeAsset}\n` +
          ` - Maximum allowed: ${maxAmountAllowed.toFixed(assetInfo.precision)} ${exchangeAsset}\n` +
          ` - Region limits: ${regionMin} - ${regionMax} ${domesticCurrency}\n` +
          ` - Credit limit: ${creditLimit} ${domesticCurrency}\n` +
          ` - Exchange rate: 1 ${exchangeAsset} = ${exchangeRate} ${domesticCurrency}`,
      );
    }
    console.log(
      `Using fallback range: ${minAmountRequired.toFixed(assetInfo.precision)} - ${maxAmountAllowed.toFixed(assetInfo.precision)} ${exchangeAsset}`,
    );
  }

  // ALWAYS use the minimum amount from the range
  const ctAmount = parseFloat(minAmountRequired.toFixed(assetInfo.precision));

  console.log(
    `\nGenerated crypto exchange CT amount: ${ctAmount} ${exchangeAsset} (MINIMUM from range)`,
  );
  console.log(
    `Equivalent in ${domesticCurrency}: ${(ctAmount * exchangeRate).toFixed(2)}`,
  );

  if (availableBalance > 0) {
    console.log(
      `Amount is ${(((ctAmount - availableBalance) / availableBalance) * 100).toFixed(2)}% above balance`,
    );
  } else {
    console.log(`Amount is above zero balance (no percentage calculation)`);
  }
  console.log(`========================================\n`);

  return { ctAmount, exchangeAsset, availableBalance };
}
