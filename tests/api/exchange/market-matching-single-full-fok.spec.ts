import { test, expect } from "@playwright/test";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { config } from "../../../test.config";
import { postOrder } from "@utils/apiUtils";
import { ServiceConfiguration } from "@utils/exchangeService/orderBook/verifyCurrencyPairExists";
import { currencyPairRecreation } from "@utils/exchangeService/settings/currencyPairRecreation";
import { configureServicesForStandardOrders } from "@utils/coreService/services/configureServicesForStandartOrders";
import { createOrder } from "@utils/exchangeService/order/createOrder";
import { createOppositeGTCOrder } from "@utils/exchangeService/order/createOppositeGtcOrder";
import { waitForOrderToBeActive } from "@utils/exchangeService/order/waitOrderToBeActive";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderInList } from "@utils/exchangeService/order/waitForOrderInList";
import { waitOrderToFill } from "@utils/exchangeService/order/waitOrderToFill";
import { verifyTakerTrade } from "@utils/exchangeService/trade/verifyTakerTrade";

test.describe("Matching Market buy FOK with single order by full volume", () => {
  let makerToken: string;
  let takerToken: string;
  let operatorToken: string;
  let marketOrderOuid: string;
  let limitOrderOuid: string;
  const baseCurrency = "SAR";
  const quoteCurrency = "BRL";
  const symbol = `${baseCurrency}_${quoteCurrency}`;
  let serviceConfig: ServiceConfiguration;

  test.beforeAll(async () => {
    console.log("Getting authentication tokens for both members...");

    makerToken = await getAccessToken(config.memberName, config.password);
    takerToken = await getAccessToken(config.takerName, config.password);
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("All tokens obtained successfully");

    // Pre-condition for delete all existing orders and create a clean order book
    await currencyPairRecreation(
      baseCurrency,
      quoteCurrency,
      operatorToken,
      makerToken,
    );

    // Configure services for standard orders
    serviceConfig = await configureServicesForStandardOrders(
      config.memberXmi,
      operatorToken,
    );
  });

  test("Market buy FOK order should be fully filled by limit sell order", async () => {
    // 1. Create Market Buy FOK order payload (but don't send it yet)
    const marketOrderPayload = createOrder("MARKET", "FOK", "BID");

    console.log("Market Buy FOK Order Payload (to be used for precondition):");
    console.log(JSON.stringify(marketOrderPayload, null, 2));

    // 2. Create opposite Limit Sell GTC order as precondition using the utility function
    console.log("Creating opposite Limit Sell GTC order as precondition...");
    limitOrderOuid = await createOppositeGTCOrder(
      marketOrderPayload,
      makerToken,
    );

    // Wait for order to be active in order book (NEW status)
    console.log("Waiting for Limit order to be active in order book...");
    const { order: activeOrder } = await waitForOrderToBeActive(
      limitOrderOuid,
      makerToken,
    );
    console.log(`Limit order is now active with status: ${activeOrder.status}`);

    // 3. Now create the Market Buy FOK order (taker)
    console.log("Creating Market Buy FOK Order...");
    const { response: marketOrderResponse, body: marketOrderBody } =
      await postOrder("/api/v1/orders/create", marketOrderPayload, takerToken);

    // Verify market order creation using reusable function
    marketOrderOuid = verifyOrderCreationResponse(
      marketOrderResponse,
      marketOrderBody,
    );
    console.log(`Market Buy FOK order created with OUID: ${marketOrderOuid}`);

    // Wait for market order to appear in list
    const { body: marketOrderListBody } = await waitForOrderInList(
      marketOrderOuid,
      takerToken,
    );
    const marketOrder = marketOrderListBody.content[0];
    console.log(`Market order found with status: ${marketOrder.status}`);

    // 4. Wait for market order to be FILLED
    console.log("Waiting for market order to be filled...");
    const { order: filledMarketOrder } = await waitOrderToFill(
      marketOrderOuid,
      takerToken,
    );

    expect(filledMarketOrder.ouid).toBe(marketOrderOuid);
    expect(filledMarketOrder.status).toBe("FILLED");
    expect(filledMarketOrder.executed_quantity).toBe(
      marketOrderPayload.quantity,
    );
    expect(filledMarketOrder.type).toBe("MARKET");
    expect(filledMarketOrder.direction).toBe("BID");
    expect(filledMarketOrder.constraint).toBe("FOK");

    // 5. Verify the limit order was filled
    const { body: updatedLimitOrderBody } = await waitForOrderInList(
      limitOrderOuid,
      makerToken,
    );
    const updatedLimitOrder = updatedLimitOrderBody.content[0];
    console.log(`Limit order after matching - Status: ${updatedLimitOrder.status}, 
        Executed: ${updatedLimitOrder.executed_quantity}/${updatedLimitOrder.quantity}`);

    // 6. Verify trade was created using reusable function
    const matchingTrade = await verifyTakerTrade(
      marketOrderOuid,
      marketOrderPayload.quantity,
      symbol,
      "BID",
      "Market Buy FOK",
      takerToken,
    );

    // Trade Summary
    console.log("\n=== Trade Summary ===");
    console.log(`Maker (Limit Sell GTC):`);
    console.log(`  - OUID: ${limitOrderOuid}`);
    console.log(`  - Direction: ASK`);
    console.log(
      `  - Selling ${marketOrderPayload.quantity} ${baseCurrency} at ${marketOrderPayload.price} ${quoteCurrency}`,
    );
    console.log(`Taker (Market Buy FOK):`);
    console.log(`  - OUID: ${marketOrderOuid}`);
    console.log(`  - Direction: ${matchingTrade.order_direction}`);
    console.log(`  - Buying ${marketOrderPayload.quantity} ${baseCurrency}`);
    console.log(`Trade:`);
    console.log(`  - TUID: ${matchingTrade.tuid}`);
    console.log(`  - Quantity: ${matchingTrade.quantity} ${baseCurrency}`);
    console.log(`  - Value: ${matchingTrade.quote_quantity} ${quoteCurrency}`);
    console.log(`  - Status: ${matchingTrade.status}`);
  });
});
