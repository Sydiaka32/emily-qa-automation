import { verifyTradeForOrder } from "./verifyTradeForOrder";
import { TradeVerificationOptions } from "../../coreService/services/restoreServices";

/**
 * Verifies trade for a taker order (market orders)
 */
export async function verifyTakerTrade(
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
    false, // is_maker: false for taker orders
    expectedOrderDirection,
    expectedOrderType,
    token,
    options,
  );
}
