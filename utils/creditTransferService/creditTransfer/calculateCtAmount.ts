import { getRegionLimitsForMember } from "@utils/coreService/regions/getRegionLimits";
import { getCreditLimit } from "@utils/clearingService/creditLimits/getCreditLimit";
import { extractDomesticCurrency } from "@utils/coreService/extractDomesticCurrency";

export async function calculateCtAmount(
  memberInfo: any,
  operatorToken: string,
  senderToken: string,
): Promise<{ ctAmount: number; domesticCurrency: string }> {
  const domesticCurrency = extractDomesticCurrency(memberInfo);
  console.log(`Domestic currency: ${domesticCurrency}`);

  // Get regional limits and calculate amount
  const regionLimits = await getRegionLimitsForMember(
    memberInfo,
    operatorToken,
  );
  const minRegionalLimit = regionLimits.min_transaction_amount_flat;
  const ctAmount = minRegionalLimit + 0.01;

  console.log(`Regional min: ${minRegionalLimit}, Using amount: ${ctAmount}`);

  // Verify against credit limit
  const creditLimitData = await getCreditLimit(senderToken);
  const currentCreditLimit = creditLimitData.global_current_limit;

  if (ctAmount > currentCreditLimit) {
    throw new Error(
      `Amount ${ctAmount} exceeds credit limit ${currentCreditLimit}. Cannot proceed with FICT.`,
    );
  }
  console.log(
    `Amount ${ctAmount} is within credit limit ${currentCreditLimit}`,
  );

  return { ctAmount, domesticCurrency };
}
