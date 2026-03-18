import { expect } from "@playwright/test";

/**
 * Extract domestic currency from member information
 */
export function extractDomesticCurrency(memberInfo: any): string {
  const domesticCurrency = memberInfo.domestic_currency;
  expect(domesticCurrency).toBeDefined();
  expect(typeof domesticCurrency).toBe("string");
  expect(domesticCurrency.length).toBe(3); // Currency codes are typically 3 characters

  console.log(`Domestic currency extracted: ${domesticCurrency}`);
  return domesticCurrency;
}
