import { getCreditLimit } from "@utils/clearingService/creditLimits/getCreditLimit";
import { extractDomesticCurrency } from "@utils/coreService/extractDomesticCurrency";

export async function calculateInvalidAmountAboveGcl(
  memberInfo: any,
  senderToken: string,
): Promise<{
  invalidAmount: number;
  domesticCurrency: string;
  globalCurrentLimit: number;
}> {
  console.log("Calculating invalid amount above GCL...");

  const domesticCurrency = extractDomesticCurrency(memberInfo);
  console.log(`Domestic currency: ${domesticCurrency}`);

  // Get credit limit
  const creditLimitData = await getCreditLimit(senderToken);
  const globalCurrentLimit = creditLimitData.global_current_limit;

  // Calculate amount above GCL (GCL + 0.01)
  const invalidAmount = globalCurrentLimit + 0.01;

  console.log(`\n=== GCL Amount Calculation ===`);
  console.log(`Global Current Limit (GCL): ${globalCurrentLimit}`);
  console.log(`Invalid amount (GCL + 0.01): ${invalidAmount}`);
  console.log(`================================\n`);

  return { invalidAmount, domesticCurrency, globalCurrentLimit };
}
