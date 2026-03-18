import { test, expect } from "@playwright/test";
import {
  getAccessToken,
  getOperatorToken,
} from "@utils/auth";
import { config } from "../../../test.config";
import { postOrder } from "@utils/apiUtils";
import { ServiceConfiguration } from "@utils/exchangeService/orderBook/verifyCurrencyPairExists";
import { currencyPairRecreation } from "@utils/exchangeService/settings/currencyPairRecreation";
import { configureServicesForDynamicLimit } from "@utils/coreService/services/configureServiceForDynamicLimit";
import { createOrder } from "@utils/exchangeService/order/createOrder";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderInList } from "@utils/exchangeService/order/waitForOrderInList";
import { verifyOrderInList } from "@utils/exchangeService/order/verifyOrderInList";
import { waitForOrderToBeActive } from "@utils/exchangeService/order/waitOrderToBeActive";
import { createOppositeMarketIOCOrder } from "@utils/exchangeService/order/createOppositeMarketIocOrder";
import { waitOrderToFill } from "@utils/exchangeService/order/waitOrderToFill";
import { OrderStatuses } from "../../../consts/exchange/orderStatuses";
import { verifyMakerTrade } from "@utils/exchangeService/trade/verifyMakerTrade";
import { restoreServices } from "@utils/coreService/services/restoreServices";

test.describe("Matching Dynamic Limit buy GTC with single order by full volume", () => {
  let makerToken: string;
  let takerToken: string;
  let operatorToken: string;
  let dynamicLimitOrderOuid: string;
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

    // Configure services for Dynamic Limit orders using the reusable function
    serviceConfig = await configureServicesForDynamicLimit(
      config.memberXmi,
      operatorToken,
    );
  });

  test("Dynamic Limit buy GTC order should be fully filled by market sell order", async () => {
    // 1. Create Dynamic Limit Buy GTC order
    const orderPayload = createOrder("DYNAMIC_LIMIT", "GTC", "BID");

    console.log("Creating Dynamic Limit Buy GTC Order...");
    const { response: limitOrderResponse, body: limitOrderBody } =
      await postOrder("/api/v1/orders/create", orderPayload, makerToken);

    // Verify order creation using reusable function
    dynamicLimitOrderOuid = verifyOrderCreationResponse(
      limitOrderResponse,
      limitOrderBody,
    );
    console.log(
      `Dynamic Limit Buy GTC order created with OUID: ${dynamicLimitOrderOuid}`,
    );

    // Wait for order to appear in list and verify using reusable function
    const { body: orderBody } = await waitForOrderInList(
      dynamicLimitOrderOuid,
      makerToken,
    );
    const createdOrder = verifyOrderInList(
      orderBody,
      dynamicLimitOrderOuid,
      orderPayload,
    );
    console.log(
      `Dynamic Limit order found with initial status: ${createdOrder.status}`,
    );

    // Wait for order to be active in order book (NEW status)
    console.log(
      "Waiting for Dynamic Limit order to be active in order book...",
    );
    const { order: activeOrder } = await waitForOrderToBeActive(
      dynamicLimitOrderOuid,
      makerToken,
    );
    console.log(
      `Dynamic Limit order is now active with status: ${activeOrder.status}`,
    );

    // ADDED: Wait for order book synchronization
    console.log("Waiting 2 seconds for order book synchronization...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Create Market Sell Order to match using the utility function
    console.log("Creating Market Sell Order to match...");
    const marketOrderOuid = await createOppositeMarketIOCOrder(
      orderPayload,
      takerToken,
      true, // Set isDynamicLimit to true to ensure proper handling
    );

    // Verify market order was created and is in the system
    const { body: marketOrderListBody } = await waitForOrderInList(
      marketOrderOuid,
      takerToken,
    );
    const marketOrder = marketOrderListBody.content[0];
    console.log(`Market order is in system with status: ${marketOrder.status}`);
    expect(marketOrder.ouid).toBe(marketOrderOuid);
    expect(marketOrder.direction).toBe("ASK"); // Should be sell order
    expect(marketOrder.type).toBe("MARKET");
    expect(marketOrder.constraint).toBe("IOC");

    // 3. Wait for Dynamic Limit order to be FILLED
    console.log("Waiting for Dynamic Limit order to be filled...");
    const { order: filledOrder } = await waitOrderToFill(
      dynamicLimitOrderOuid,
      makerToken,
    );

    expect(filledOrder.ouid).toBe(dynamicLimitOrderOuid);
    expect(filledOrder.status).toBe(OrderStatuses.filled);
    expect(filledOrder.executed_quantity).toBe(orderPayload.quantity);
    expect(filledOrder.type).toBe("DYNAMIC_LIMIT"); // Verify it's a Dynamic Limit order
    expect(filledOrder.direction).toBe("BID"); // Verify it's a buy order

    // 4. Verify trade was created using the reusable function
    await verifyMakerTrade(
      dynamicLimitOrderOuid,
      orderPayload.quantity,
      symbol,
      "BID",
      "Dynamic Limit Buy",
      makerToken,
    );
  });

  test.afterAll(async () => {
    // Cleanup services using the reusable function
    await restoreServices(serviceConfig);
  });
});
