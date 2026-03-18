import { test, expect } from "@playwright/test";
import {
  getAccessToken,
  getOperatorToken,
} from "@utils/auth";
import { config } from "../../../test.config";
import { postOrder } from "@utils/apiUtils";
import { ServiceConfiguration } from "@utils/exchangeService/orderBook/verifyCurrencyPairExists";
import { currencyPairRecreation } from "@utils/exchangeService/settings/currencyPairRecreation";
import { configureServicesForStandardOrders } from "@utils/coreService/services/configureServicesForStandartOrders";
import { createOrder } from "@utils/exchangeService/order/createOrder";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderToBeActive } from "@utils/exchangeService/order/waitOrderToBeActive";
import { createOppositeMarketIOCOrder } from "@utils/exchangeService/order/createOppositeMarketIocOrder";
import { waitOrderToFill } from "@utils/exchangeService/order/waitOrderToFill";
import { verifyMakerTrade } from "@utils/exchangeService/trade/verifyMakerTrade";
import { restoreServices } from "@utils/coreService/services/restoreServices";

test.describe("Matching Spot buy GTC with single order by full volume", () => {
  let makerToken: string;
  let takerToken: string;
  let operatorToken: string;
  let spotOrderOuid: string;
  let marketOrderOuid: string;
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

    // Configure services for standard orders (enable trader, disable liquidity provider)
    serviceConfig = await configureServicesForStandardOrders(
      config.memberXmi,
      operatorToken,
    );
  });

  test("Spot buy GTC order should be fully filled by market sell order", async () => {
    // 1. Create Spot Buy GTC order
    const orderPayload = createOrder("SPOT_OUTRIGHT", "GTC", "BID");

    console.log("Creating Spot Buy GTC Order...");
    const { response: spotOrderResponse, body: spotOrderBody } =
      await postOrder("/api/v1/orders/create", orderPayload, makerToken);

    console.log("Response body:", JSON.stringify(spotOrderBody, null, 2));

    // Verify order creation using utility function
    spotOrderOuid = verifyOrderCreationResponse(
      spotOrderResponse,
      spotOrderBody,
    );
    console.log(`Spot Buy GTC order created with OUID: ${spotOrderOuid}`);

    // Wait for order to be active in order book
    console.log("Waiting for Spot order to be active in order book...");
    const { order: activeOrder } = await waitForOrderToBeActive(
      spotOrderOuid,
      makerToken,
    );
    console.log(`Spot order is now active with status: ${activeOrder.status}`);

    // ADDED: Wait for order book synchronization
    console.log(
      "Waiting 2 seconds for Spot order to be available in order book...",
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Create Market Sell Order to match using the utility function
    console.log("Creating Market Sell Order to match...");
    marketOrderOuid = await createOppositeMarketIOCOrder(
      orderPayload,
      takerToken,
    );

    // 3. Wait for Spot order to be FILLED
    console.log("Waiting for Spot order to be filled...");
    const { order: filledOrder } = await waitOrderToFill(
      spotOrderOuid,
      makerToken,
    );

    // Verify filled order properties
    expect(filledOrder.ouid).toBe(spotOrderOuid);
    expect(filledOrder.status).toBe("FILLED");
    expect(filledOrder.executed_quantity).toBe(orderPayload.quantity);
    expect(filledOrder.type).toBe("SPOT_OUTRIGHT");
    expect(filledOrder.direction).toBe("BID");

    // 4. Verify trade was created using utility function
    console.log("Verifying trade creation...");
    await verifyMakerTrade(
      spotOrderOuid,
      orderPayload.quantity,
      symbol,
      "BID", // Spot order direction (buy)
      "Spot Buy GTC",
      makerToken,
    );

    // ADDED: Final summary
    console.log("\n=== Final Summary ===");
    console.log(`Spot Buy Order: ${spotOrderOuid}`);
    console.log(`Market Sell Order: ${marketOrderOuid}`);
    console.log(`Quantity: ${orderPayload.quantity} ${baseCurrency}`);
    console.log(`Status: ${filledOrder.status}`);
    console.log(
      `Executed: ${filledOrder.executed_quantity}/${filledOrder.quantity}`,
    );
  });

  test.afterAll(async () => {
    // Restore services to original state
    await restoreServices(serviceConfig);
  });
});
