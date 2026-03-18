import { getCurrentMember } from "./members/getCurrentMember";
import { extractDomesticCurrency } from "./extractDomesticCurrency";

/**
 * Get domestic currency for member in one call
 * Combines getCurrentMember and extractDomesticCurrency
 */
export async function getDomesticCurrency(token: string): Promise<string> {
  const memberInfo = await getCurrentMember(token);
  return extractDomesticCurrency(memberInfo);
}
