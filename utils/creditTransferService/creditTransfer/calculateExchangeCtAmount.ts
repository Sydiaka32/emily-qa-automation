import { getMemberPositions } from "@utils/clearingService/positions/getMemberPositions";
import { findAssetsForExchange } from "./findAssetForExchange";
import { getAvailableBalance } from "@utils/clearingService/positions/getAvailableBalance";
import { getRegionLimitsForMember } from "@utils/coreService/regions/getRegionLimits";
import { getCreditLimit } from "@utils/clearingService/creditLimits/getCreditLimit";
import { extractDomesticCurrency } from "@utils/coreService/extractDomesticCurrency";
import { config } from "../../../test.config";

export async function calculateExchangeCtAmount(
  memberInfo: any,
  operatorToken: string,
  senderToken: string,
): Promise<{
  ctAmount: number;
  exchangeAsset: string;
  availableBalance: number;
}> {
  console.log("Calculating exchange credit transfer amount...");

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

  // Use the first common asset
  const exchangeAsset = commonAssets[0];
  console.log(`Selected exchange asset: ${exchangeAsset}`);

  // Get available balance for the exchange asset
  const availableBalance = getAvailableBalance(senderPositions, exchangeAsset);
  console.log(`Available balance for ${exchangeAsset}: ${availableBalance}`);

  // Get credit limit and region limits
  console.log("Getting limits for exchange amount calculation...");
  const [creditLimitData, regionLimits] = await Promise.all([
    getCreditLimit(senderToken),
    getRegionLimitsForMember(memberInfo, operatorToken),
  ]);

  const regionMin = regionLimits.min_transaction_amount_flat;
  const regionMax = regionLimits.max_transaction_amount_flat;
  const creditLimit = creditLimitData.global_current_limit;

  console.log(`\n=== Exchange CT Amount Calculation ===`);
  console.log(`Available balance: ${availableBalance}`);
  console.log(`Region limits: ${regionMin} - ${regionMax}`);
  console.log(`Credit limit: ${creditLimit}`);

  // Calculate amount slightly higher than available balance (5-10% higher)
  const minExchangeAmount = availableBalance * 1.05;
  const maxExchangeAmount = availableBalance * 1.1;

  console.log(
    `Target exchange range: ${minExchangeAmount.toFixed(2)} - ${maxExchangeAmount.toFixed(2)}`,
  );

  // We need an amount greater than available balance to trigger exchange
  const minAmount = Math.max(
    minExchangeAmount,
    regionMin,
    availableBalance + 0.01,
  );
  const maxAmount = Math.min(maxExchangeAmount, regionMax, creditLimit);

  if (minAmount > maxAmount) {
    // Fallback: any valid amount above balance
    const fallbackMin = Math.max(availableBalance + 0.01, regionMin);
    const fallbackMax = Math.min(regionMax, creditLimit);

    if (fallbackMin > fallbackMax) {
      throw new Error(
        `Cannot find valid exchange amount:\n` +
          ` - Available balance: ${availableBalance}\n` +
          ` - Minimum required: ${fallbackMin}\n` +
          ` - Maximum allowed: ${fallbackMax}\n` +
          ` - Region limits: ${regionMin} - ${regionMax}\n` +
          ` - Credit limit: ${creditLimit}`,
      );
    }

    const randomAmount =
      fallbackMin + Math.random() * (fallbackMax - fallbackMin);
    const ctAmount = Math.round(randomAmount * 100) / 100;

    console.log(
      `Using fallback range: ${fallbackMin.toFixed(2)} - ${fallbackMax.toFixed(2)}`,
    );
    console.log(`Generated exchange CT amount: ${ctAmount}`);
    console.log(`========================================\n`);

    return { ctAmount, exchangeAsset, availableBalance };
  }

  // Generate random amount between minAmount and maxAmount
  const randomAmount = minAmount + Math.random() * (maxAmount - minAmount);
  const ctAmount = Math.round(randomAmount * 100) / 100;

  console.log(
    `Using preferred exchange range: ${minAmount.toFixed(2)} - ${maxAmount.toFixed(2)}`,
  );
  console.log(`Generated exchange CT amount: ${ctAmount}`);
  console.log(
    `Amount is ${(((ctAmount - availableBalance) / availableBalance) * 100).toFixed(2)}% above balance`,
  );
  console.log(`========================================\n`);

  return { ctAmount, exchangeAsset, availableBalance };
}
