import { getRegionLimitsForMember } from "@utils/coreService/regions/getRegionLimits";
import { extractDomesticCurrency } from "@utils/coreService/extractDomesticCurrency";

export async function calculateInvalidAmountAboveMax(
  memberInfo: any,
  operatorToken: string,
): Promise<{
  invalidAmount: number;
  domesticCurrency: string;
  maxRegionalLimit: number;
}> {
  console.log("Calculating invalid amount above regional maximum...");

  const domesticCurrency = extractDomesticCurrency(memberInfo);
  console.log(`Domestic currency: ${domesticCurrency}`);

  // Get regional limits
  const regionLimits = await getRegionLimitsForMember(
    memberInfo,
    operatorToken,
  );
  const maxRegionalLimit = regionLimits.max_transaction_amount_flat;

  // Calculate amount above maximum (max + 0.01)
  const invalidAmount = maxRegionalLimit + 0.01;

  console.log(`\n=== Invalid Amount Calculation (Above Max) ===`);
  console.log(`Regional maximum: ${maxRegionalLimit}`);
  console.log(`Invalid amount (max + 0.01): ${invalidAmount}`);
  console.log(
    `Amount is ${(((invalidAmount - maxRegionalLimit) / maxRegionalLimit) * 100).toFixed(2)}% above maximum`,
  );
  console.log(`==============================================\n`);

  return { invalidAmount, domesticCurrency, maxRegionalLimit };
}
