import { getRequest } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Verifies a specific currency pair is present in the list
 */
export async function verifyCurrencyPairExists(
  symbol: string,
  memberToken: string,
  maxRetries: number = 25,
  retryDelay: number = 500,
): Promise<void> {
  const [baseCurrency, quoteCurrency] = symbol.split("_");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Verifying currency pair ${symbol} - attempt ${attempt}/${maxRetries}`,
      );

      const { response, body } = await getRequest(
        `/api/v1/market/pairs?page=0&size=100`,
        memberToken,
      );

      expect(response.status()).toBe(200);
      expect(Array.isArray(body.content)).toBe(true);

      const currencyPair = body.content.find(
        (pair: any) =>
          pair.base === baseCurrency && pair.quote === quoteCurrency,
      );

      if (currencyPair) {
        console.log(`Currency pair ${symbol} verified successfully:`);
        console.log(`   - Base: ${currencyPair.base}`);
        console.log(`   - Quote: ${currencyPair.quote}`);
        console.log(`   - Min Order Amount: ${currencyPair.minOrderAmount}`);
        console.log(`   - Max Order Amount: ${currencyPair.maxOrderAmount}`);
        return;
      }

      if (attempt === maxRetries) {
        new Error(
          `Currency pair ${symbol} not found after ${maxRetries} attempts`,
        );
      }

      console.log(
        `Currency pair ${symbol} not found, retrying in ${retryDelay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);

      if (attempt === maxRetries) {
        throw new Error(`Failed to verify currency pair ${symbol}: ${message}`);
      }

      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

export interface ServiceConfiguration {
  originalServices: any[];
  memberXmi: string;
  operatorToken: string;
}
