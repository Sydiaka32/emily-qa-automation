import { TradeVerificationOptions } from "../../coreService/services/restoreServices";
import { getTrades } from "@utils/apiUtils";
import { expect } from "@playwright/test";

/**
 * Verifies multiple trades for an order and checks total executed quantity
 */
export async function verifyMultipleTradesForOrder(
  orderOuid: string,
  expectedTotalQuantity: number,
  expectedSymbol: string,
  expectedIsMaker: boolean,
  expectedOrderDirection: string,
  expectedOrderType: string,
  token: string,
  expectedTradeCount: number = 2,
  options: TradeVerificationOptions = {},
): Promise<any[]> {
  const { expectedPrice, additionalChecks } = options;

  // Wait for trade processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { body: tradesResponse } = await getTrades(0, 10, token);
  const tradesArray = tradesResponse.content;
  console.log(`Found ${tradesArray.length} trades in response`);

  // Find all trades with our order OUID
  const matchingTrades = tradesArray.filter(
    (trade: any) => trade.ouid === orderOuid && trade.symbol === expectedSymbol,
  );

  expect(matchingTrades.length).toBe(expectedTradeCount);
  console.log(`Found ${matchingTrades.length} trades for order ${orderOuid}`);

  // Verify basic properties of each trade
  matchingTrades.forEach((trade: any, index: number) => {
    console.log(`Trade ${index + 1}:`);
    console.log(`  - Trade ID: ${trade.tuid}`);
    console.log(`  - Quantity: ${trade.quantity}`);
    console.log(`  - Price: ${trade.price}`);

    expect(trade.ouid).toBe(orderOuid);
    expect(trade.status).toBe("COMPLETED");
    expect(trade.symbol).toBe(expectedSymbol);
    expect(trade.is_maker).toBe(expectedIsMaker);
    expect(trade.order_direction).toBe(expectedOrderDirection);

    // Optional price verification
    if (expectedPrice !== undefined) {
      expect(trade.price).toBe(expectedPrice);
    }

    // Additional custom checks
    if (additionalChecks) {
      additionalChecks(trade);
    }
  });

  // Calculate total executed quantity from ALL trades
  const totalExecutedFromTrades = matchingTrades.reduce(
    (sum: number, trade: any) => sum + trade.quantity,
    0,
  );
  console.log(
    `Total executed quantity from trades: ${totalExecutedFromTrades}`,
  );

  // Verify total quantity matches expected
  expect(totalExecutedFromTrades).toBeCloseTo(expectedTotalQuantity, 1);

  return matchingTrades;
}
