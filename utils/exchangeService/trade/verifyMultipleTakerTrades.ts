import { TradeVerificationOptions } from "../../coreService/services/restoreServices";
import { verifyMultipleTradesForOrder } from "./verifyMultipleTradesForOrder";

/**
 * Verifies multiple trades for a taker order
 */
export async function verifyMultipleTakerTrades(
  orderOuid: string,
  expectedTotalQuantity: number,
  expectedSymbol: string,
  expectedOrderDirection: string,
  expectedOrderType: string,
  token: string,
  expectedTradeCount: number = 2,
  options: TradeVerificationOptions = {},
): Promise<any[]> {
  return verifyMultipleTradesForOrder(
    orderOuid,
    expectedTotalQuantity,
    expectedSymbol,
    false, // is_maker: false for taker orders
    expectedOrderDirection,
    expectedOrderType,
    token,
    expectedTradeCount,
    options,
  );
}
