import { getCreditTransferData } from "./getCreditTransferData";
import { getMemberPositions } from "../../clearingService/positions/getMemberPositions";
import { findAssetsForExchange } from "./findAssetForExchange";
import { getAvailableBalance } from "../../clearingService/positions/getAvailableBalance";
import { getRegionLimitsForMember } from "../../coreService/regions/getRegionLimits";
import { verifyCTAmountWithinRegionLimits } from "./verifyCtAmountWithinRegionLimits";
import { getCreditLimit } from "../../clearingService/creditLimits/getCreditLimit";
import { verifyCreditLimitSufficient } from "../../clearingService/creditLimits/verifyCreditLimitSufficient";
import { getAccessToken } from "@utils/auth";
import { CreditTransferConfig } from "../../../modules/creditTransfer/creditTransferConfig";
import { ExchangeCreditTransferData } from "../../../modules/creditTransfer/exchangeCreditTransferData";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";

/**
 * Calculate exchange CT amount that is slightly higher than available balance
 * to trigger exchange while staying within limits
 */
function calculateExchangeCTAmount(
  availableBalance: number,
  regionLimits: any,
  creditLimit: number,
): number {
  const regionMin = regionLimits.min_transaction_amount_flat;
  const regionMax = regionLimits.max_transaction_amount_flat;

  console.log(`\n=== Exchange CT Amount Calculation ===`);
  console.log(`Available balance: ${availableBalance}`);
  console.log(`Region limits: ${regionMin} - ${regionMax}`);
  console.log(`Credit limit: ${creditLimit}`);

  // Calculate amount slightly higher than available balance (5-10% higher)
  const minExchangeAmount = availableBalance * 1.05; // 5% higher than balance
  const maxExchangeAmount = availableBalance * 1.1; // 10% higher than balance

  console.log(
    `Target exchange range: ${minExchangeAmount.toFixed(2)} - ${maxExchangeAmount.toFixed(2)}`,
  );

  // We need an amount greater than available balance to trigger exchange
  // But also within region and credit limits
  const minAmount = Math.max(
    minExchangeAmount,
    regionMin,
    availableBalance + 0.01,
  );
  const maxAmount = Math.min(maxExchangeAmount, regionMax, creditLimit);

  if (minAmount > maxAmount) {
    // If our preferred range doesn't work, try to find any valid amount above balance
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

    // Use fallback range
    const randomAmount =
      fallbackMin + Math.random() * (fallbackMax - fallbackMin);
    const ctAmount = Math.round(randomAmount * 100) / 100;

    console.log(
      `Using fallback range: ${fallbackMin.toFixed(2)} - ${fallbackMax.toFixed(2)}`,
    );
    console.log(`Generated exchange CT amount: ${ctAmount}`);
    console.log(`========================================\n`);

    return ctAmount;
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

  return ctAmount;
}

/**
 * Gets exchange-specific data for credit transfer with currency exchange
 */
export async function getExchangeCreditTransferData(
  config: CreditTransferConfig,
  exchangeMultiplier: number = 1.2,
): Promise<ExchangeCreditTransferData> {
  console.log("Getting exchange credit transfer data...");

  // Get basic credit transfer data for tokens and basic setup
  const basicData = await getCreditTransferData(config, 0.001);

  // Get maker token for creating opposite orders (different member to avoid self-trading)
  console.log("Getting maker token for opposite orders...");
  const makerToken = await getAccessToken(config.makerName, config.password);

  // Exchange-specific steps
  console.log("Getting member positions for both members...");
  const [senderPositions, receiverPositions] = await Promise.all([
    getMemberPositions(config.memberXmi, basicData.operatorToken),
    getMemberPositions(basicData.receiverXmi, basicData.operatorToken),
  ]);

  // Find assets suitable for exchange (sender INDIRECT, receiver any type)
  console.log("Finding assets suitable for exchange...");
  const commonAssets = findAssetsForExchange(
    senderPositions,
    receiverPositions,
    basicData.senderDomesticCurrency,
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

  // Get credit limit and region limits for calculation
  console.log("Getting limits for exchange amount calculation...");
  const [creditLimitData, regionLimits] = await Promise.all([
    getCreditLimit(basicData.senderToken),
    getRegionLimitsForMember(
      await getCurrentMember(basicData.senderToken),
      basicData.operatorToken,
    ),
  ]);

  // Calculate CT amount that will trigger exchange (slightly higher than available balance)
  // but still within credit and region limits
  const ctAmount = calculateExchangeCTAmount(
    availableBalance,
    regionLimits,
    creditLimitData.global_current_limit,
  );

  console.log(`Final exchange details:`);
  console.log(`- Available balance: ${availableBalance} ${exchangeAsset}`);
  console.log(`- CT amount: ${ctAmount} ${exchangeAsset}`);
  console.log(
    `- Exchange needed: ${(ctAmount - availableBalance).toFixed(2)} ${exchangeAsset}`,
  );

  // Verify the calculated amount is within both credit and region limits
  verifyCreditLimitSufficient(creditLimitData, ctAmount);
  verifyCTAmountWithinRegionLimits(ctAmount, regionLimits);

  const exchangeNeeded = ctAmount - availableBalance;

  return {
    ...basicData,
    makerToken,
    exchangeAsset,
    availableBalance,
    ctAmount,
    exchangeNeeded,
  };
}
