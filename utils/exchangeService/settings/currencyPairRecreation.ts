import { deleteCurrencyPair, postCurrencyPair } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { expect } from "@playwright/test";
import { verifyOrderBookIsEmpty } from "../orderBook/verifyOrderBookIsEmpty";
import { verifyCurrencyPairExists } from "../orderBook/verifyCurrencyPairExists";

/**
 * Deletes and creates a specific currency pair.
 * Handles 404 gracefully if currency pair doesn't exist
 */
export async function currencyPairRecreation(
  baseCurrency: string,
  quoteCurrency: string,
  operatorToken: string,
  memberToken: string,
): Promise<void> {
  const symbol = `${baseCurrency}_${quoteCurrency}`;

  // Attempt to delete the currency pair, handling 404 gracefully
  console.log(
    `Attempting to delete currency pair ${baseCurrency}/${quoteCurrency}...`,
  );
  try {
    const deleteResponse = await deleteCurrencyPair(
      baseCurrency,
      quoteCurrency,
      operatorToken,
    );

    console.log(
      `Full URL: ${config.backofficeBaseUrl}/api/v1/market-admin/pairs/${baseCurrency}/${quoteCurrency}`,
    );

    if (deleteResponse.status() === 200) {
      console.log(`Currency pair deleted successfully`);

      // Wait for deletion to propagate and verify order book is empty
      console.log(`Waiting for order book to clear after deletion...`);
      await verifyOrderBookIsEmpty(symbol);
      console.log(`Order book confirmed empty after deletion`);
    } else if (deleteResponse.status() === 404) {
      console.log(
        `Currency pair ${baseCurrency}/${quoteCurrency} does not exist, skipping deletion...`,
      );
    } else {
      new Error(
        `Unexpected status during deletion: ${deleteResponse.status()}`,
      );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);
    const status =
      typeof error === "object" && error !== null && "response" in error
        ? (error as any).response?.status
        : undefined;
    // If the deletion fails with 404, log and continue
    if (message.includes("404") || status === 404) {
      console.log(
        `Currency pair ${baseCurrency}/${quoteCurrency} does not exist, skipping deletion...`,
      );
    } else {
      throw error;
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`Recreating currency pair ${baseCurrency}/${quoteCurrency}...`);
  const pairPayload = {
    base: baseCurrency,
    quote: quoteCurrency,
    minOrderAmount: 0,
    maxOrderAmount: 1000000,
  };

  const createResponse = await postCurrencyPair(pairPayload, operatorToken);
  console.log(createResponse);
  expect(createResponse.status()).toBe(200);
  console.log("Currency pair recreated successfully");

  // Verify currency pair is actually created and accessible
  console.log(`Verifying currency pair ${symbol} is accessible...`);
  await verifyCurrencyPairExists(symbol, memberToken);

  // Verify the order book remains empty after recreation (no lingering orders)
  console.log(`Verifying order book remains empty after recreation...`);
  await verifyOrderBookIsEmpty(symbol);
  console.log(`Order book confirmed empty after recreation`);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`Currency pair ${symbol} recreated with clean order book`);
}
