import { expect } from "@playwright/test";
import { getTrades } from "@utils/apiUtils";
import { TradeVerificationOptions } from "../../coreService/services/restoreServices";

/**
 * Verifies that a trade was created for a specific order
 */
export async function verifyTradeForOrder(
  orderOuid: string,
  expectedQuantity: number,
  expectedSymbol: string,
  expectedIsMaker: boolean,
  expectedOrderDirection: string,
  expectedOrderType: string,
  token: string,
  options: TradeVerificationOptions = {},
): Promise<any> {
  const { expectedPrice, expectedQuoteQuantity, additionalChecks } = options;

  // Wait for trade processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { body: tradesResponse } = await getTrades(0, 10, token);

  // Extract trades array from the response
  const tradesArray = tradesResponse.content;
  console.log(`Found ${tradesArray.length} trades in response`);

  // Find the trade with our order OUID
  const matchingTrade = tradesArray.find(
    (trade: any) => trade.ouid === orderOuid && trade.symbol === expectedSymbol,
  );

  expect(matchingTrade).toBeDefined();
  expect(matchingTrade.ouid).toBe(orderOuid);
  expect(matchingTrade.status).toBe("COMPLETED");
  expect(matchingTrade.quantity).toBe(expectedQuantity);
  expect(matchingTrade.symbol).toBe(expectedSymbol);
  expect(matchingTrade.is_maker).toBe(expectedIsMaker);
  expect(matchingTrade.order_direction).toBe(expectedOrderDirection);

  // Optional price verification
  if (expectedPrice !== undefined) {
    expect(matchingTrade.price).toBe(expectedPrice);
  }

  // Optional quote quantity verification
  if (expectedQuoteQuantity !== undefined) {
    expect(matchingTrade.quote_quantity).toBe(expectedQuoteQuantity);
  }

  // Additional custom checks
  if (additionalChecks) {
    additionalChecks(matchingTrade);
  }

  console.log("Trade verified successfully:");
  console.log(`  - Trade ID: ${matchingTrade.tuid}`);
  console.log(`  - Quantity: ${matchingTrade.quantity}`);
  console.log(`  - Price: ${matchingTrade.price}`);
  console.log(`  - Order OUID: ${matchingTrade.ouid}`);
  console.log(`  - Is Maker: ${matchingTrade.is_maker}`);
  console.log(`  - Order Direction: ${matchingTrade.order_direction}`);
  console.log(`  - Order Type: ${expectedOrderType}`);

  return matchingTrade;
}
