import { getRegionLimitsForMember } from "@utils/coreService/regions/getRegionLimits";
import { extractDomesticCurrency } from "@utils/coreService/extractDomesticCurrency";

export async function calculateInvalidAmountBelowMin(
  memberInfo: any,
  operatorToken: string,
): Promise<{
  invalidAmount: number;
  domesticCurrency: string;
  minRegionalLimit: number;
}> {
  console.log("Calculating invalid amount below regional minimum...");

  const domesticCurrency = extractDomesticCurrency(memberInfo);
  console.log(`Domestic currency: ${domesticCurrency}`);

  // Get regional limits
  const regionLimits = await getRegionLimitsForMember(
    memberInfo,
    operatorToken,
  );
  const minRegionalLimit = regionLimits.min_transaction_amount_flat;

  // Calculate amount below minimum (min - 0.01)
  const invalidAmount = minRegionalLimit - 0.01;

  console.log(`\n=== Invalid Amount Calculation ===`);
  console.log(`Regional minimum: ${minRegionalLimit}`);
  console.log(`Invalid amount (min - 0.01): ${invalidAmount}`);
  console.log(
    `Amount is ${(((invalidAmount - minRegionalLimit) / minRegionalLimit) * 100).toFixed(2)}% below minimum`,
  );
  console.log(`==================================\n`);

  return { invalidAmount, domesticCurrency, minRegionalLimit };
}
