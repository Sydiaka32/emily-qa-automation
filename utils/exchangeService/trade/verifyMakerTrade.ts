import { verifyTradeForOrder } from "./verifyTradeForOrder";
import { TradeVerificationOptions } from "../../coreService/services/restoreServices";

/**
 * Verifies trade for a maker order (limit/dynamic limit orders)
 */
export async function verifyMakerTrade(
  orderOuid: string,
  expectedQuantity: number,
  expectedSymbol: string,
  expectedOrderDirection: string,
  expectedOrderType: string,
  token: string,
  options: TradeVerificationOptions = {},
): Promise<any> {
  return verifyTradeForOrder(
    orderOuid,
    expectedQuantity,
    expectedSymbol,
    true, // is_maker: true for maker orders
    expectedOrderDirection,
    expectedOrderType,
    token,
    options,
  );
}
