import { test, expect } from "@playwright/test";
import {
  getAccessToken,
  getOperatorToken,
} from "@utils/auth";
import { config } from "../../../test.config";
import { currencyPairRecreation } from "@utils/exchangeService/settings/currencyPairRecreation";
import { configureServicesForStandardOrders } from "@utils/coreService/services/configureServicesForStandartOrders";
import { createOrder } from "@utils/exchangeService/order/createOrder";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderInList } from "@utils/exchangeService/order/waitForOrderInList";
import { verifyOrderInList } from "@utils/exchangeService/order/verifyOrderInList";
import { waitForOrderToBeActive } from "@utils/exchangeService/order/waitOrderToBeActive";
import { createOppositeMarketIOCOrder } from "@utils/exchangeService/order/createOppositeMarketIocOrder";
import { waitOrderToFill } from "@utils/exchangeService/order/waitOrderToFill";
import { verifyMakerTrade } from "@utils/exchangeService/trade/verifyMakerTrade";
import { restoreServices } from "@utils/coreService/services/restoreServices";
import { postOrder } from "@utils/apiUtils/market/postOrder";
import { ServiceConfiguration } from "@utils/exchangeService/orderBook/verifyCurrencyPairExists";

test.describe("Matching Limit buy GTC with single order by full volume", () => {
  let makerToken: string;
  let takerToken: string;
  let operatorToken: string;
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
    console.log("Both tokens obtained successfully");

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

  test("Limit buy GTC order should be fully filled by market sell order", async () => {
    // 1. Create Limit Buy GTC order
    const orderPayload = createOrder("LIMIT", "GTC", "BID");

    console.log("Creating Limit Buy GTC Order...");
    const { response: limitOrderResponse, body: limitOrderBody } =
      await postOrder("/api/v1/orders/create", orderPayload, makerToken);
    console.log("Response body:", JSON.stringify(limitOrderBody, null, 2));

    // Verify order creation
    limitOrderOuid = verifyOrderCreationResponse(
      limitOrderResponse,
      limitOrderBody,
    );
    console.log(`Limit Buy GTC order created with OUID: ${limitOrderOuid}`);

    // Wait for order to appear in list and verify
    const { body: orderBody } = await waitForOrderInList(
      limitOrderOuid,
      makerToken,
    );
    const createdOrder = verifyOrderInList(
      orderBody,
      limitOrderOuid,
      orderPayload,
    );
    console.log(
      `Limit order found with initial status: ${createdOrder.status}`,
    );

    // Wait for order to be active in order book (NEW status)
    console.log("Waiting for limit order to be active in order book...");
    const { order: activeOrder } = await waitForOrderToBeActive(
      limitOrderOuid,
      makerToken,
    );
    console.log(`Limit order is now active with status: ${activeOrder.status}`);

    // ADDED: Wait for order book synchronization
    console.log("Waiting 2 seconds for order book synchronization...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Create Market Sell Order to match
    console.log("Creating Market Sell Order to match...");
    const marketOrderOuid = await createOppositeMarketIOCOrder(
      orderPayload,
      takerToken,
    );

    // Verify market order was created and is in the system
    const { body: marketOrderListBody } = await waitForOrderInList(
      marketOrderOuid,
      takerToken,
    );
    const marketOrder = marketOrderListBody.content[0];
    console.log(`Market order is in system with status: ${marketOrder.status}`);
    expect(marketOrder.ouid).toBe(marketOrderOuid);
    expect(marketOrder.direction).toBe("ASK");
    expect(marketOrder.type).toBe("MARKET");
    expect(marketOrder.constraint).toBe("IOC");

    // 3. Wait for limit order to be FILLED
    console.log("Waiting for limit order to be filled...");
    const { order: filledOrder } = await waitOrderToFill(
      limitOrderOuid,
      makerToken,
    );

    expect(filledOrder.ouid).toBe(limitOrderOuid);
    expect(filledOrder.status).toBe("FILLED");
    expect(filledOrder.executed_quantity).toBe(orderPayload.quantity);

    // 4. Verify trade was created
    await verifyMakerTrade(
      limitOrderOuid,
      orderPayload.quantity,
      symbol,
      "BID",
      "Limit Buy",
      makerToken,
    );
  });

  test.afterAll(async () => {
    // Cleanup services
    await restoreServices(serviceConfig);
  });
});
