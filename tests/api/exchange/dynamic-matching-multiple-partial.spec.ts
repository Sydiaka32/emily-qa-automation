import { test, expect } from "@playwright/test";
import {
  getAccessToken,
  getOperatorToken,
} from "@utils/auth";
import { config } from "../../../test.config";
import { postOrder } from "@utils/apiUtils";
import { generatePartialQuantity } from "../../../data/generators";
import { ServiceConfiguration } from "@utils/exchangeService/orderBook/verifyCurrencyPairExists";
import { currencyPairRecreation } from "@utils/exchangeService/settings/currencyPairRecreation";
import { configureServicesForDynamicLimit } from "@utils/coreService/services/configureServiceForDynamicLimit";
import { createOrder } from "@utils/exchangeService/order/createOrder";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderInList } from "@utils/exchangeService/order/waitForOrderInList";
import { verifyOrderInList } from "@utils/exchangeService/order/verifyOrderInList";
import { waitForOrderToBeActive } from "@utils/exchangeService/order/waitOrderToBeActive";
import { createOppositeMarketIOCOrder } from "@utils/exchangeService/order/createOppositeMarketIocOrder";
import { waitForOrderToBePartiallyFilled } from "@utils/exchangeService/order/waitForOrderToBePartiallyFilled";
import { verifyMakerTrade } from "@utils/exchangeService/trade/verifyMakerTrade";
import { waitForOrderExecutedQuantity } from "@utils/exchangeService/order/waitForOrderExecutedQuantity";
import { restoreServices } from "@utils/coreService/services/restoreServices";

test.describe("Matching Dynamic Limit sell GTC with multiple orders by partial volume", () => {
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

  test("Dynamic Limit sell GTC order should be partially filled by multiple market buy orders", async () => {
    // 1. Create Dynamic Limit Sell GTC order with generated quantity
    const orderPayload = createOrder("DYNAMIC_LIMIT", "GTC", "ASK");

    console.log("Creating Dynamic Limit Sell GTC Order...");
    const { response: limitOrderResponse, body: limitOrderBody } =
      await postOrder("/api/v1/orders/create", orderPayload, makerToken);

    // Verify order creation
    dynamicLimitOrderOuid = verifyOrderCreationResponse(
      limitOrderResponse,
      limitOrderBody,
    );
    console.log(
      `Dynamic Limit Sell GTC order created with OUID: ${dynamicLimitOrderOuid}`,
    );

    // Wait for order to appear in list and verify
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

    // Wait for order to be active in order book with extended timeout for dynamic limit
    console.log(
      "Waiting for Dynamic Limit order to be active in order book...",
    );
    const { order: activeOrder } = await waitForOrderToBeActive(
      dynamicLimitOrderOuid,
      makerToken,
      5000,
      500,
    );
    console.log(
      `Dynamic Limit order is now active with status: ${activeOrder.status}`,
    );

    console.log("Dynamic Limit Order Details:");
    console.log(`- OUID: ${dynamicLimitOrderOuid}`);
    console.log(`- Symbol: ${symbol}`);
    console.log(`- Direction: ASK (Sell)`);
    console.log(`- Quantity: ${orderPayload.quantity}`);
    console.log(`- Type: DYNAMIC_LIMIT`);
    console.log(`- Time in Force: GTC`);

    const totalQuantity = orderPayload.quantity;
    console.log(`Dynamic Limit order total quantity: ${totalQuantity}`);

    // Generate partial quantities that won't fill the entire order
    const firstPartialQuantity = generatePartialQuantity(
      totalQuantity,
      0.2,
      0.4,
    ); // 20-40% of total
    const secondPartialQuantity = generatePartialQuantity(
      totalQuantity - firstPartialQuantity,
      0.3,
      0.6,
    ); // 30-60% of remaining

    // Ensure quantities are reasonable and above minimum
    const minQuantity = 0.01; // Minimum order quantity
    if (
      firstPartialQuantity < minQuantity ||
      secondPartialQuantity < minQuantity
    ) {
      throw new Error(
        `Generated partial quantities are too small: ${firstPartialQuantity}, ${secondPartialQuantity}`,
      );
    }

    console.log(
      `Generated partial quantities: First=${firstPartialQuantity}, Second=${secondPartialQuantity}`,
    );
    console.log(
      `Total after both fills: ${(firstPartialQuantity + secondPartialQuantity).toFixed(2)}/${totalQuantity}`,
    );

    // 2. Create First Market Buy Order to partially match
    console.log("Creating First Market Buy Order for partial fill...");

    const firstMarketOrderOuid = await createOppositeMarketIOCOrder(
      {
        ...orderPayload,
        quantity: firstPartialQuantity,
      },
      takerToken,
      true, // Add flag to indicate this is for dynamic limit matching
    );

    // Verify first market order was created and processed
    const { body: firstMarketOrderListBody } = await waitForOrderInList(
      firstMarketOrderOuid,
      takerToken,
    );
    const firstMarketOrder = firstMarketOrderListBody.content[0];
    console.log(
      `First market order is in system with status: ${firstMarketOrder.status}`,
    );

    // 3. Wait for first partial fill and verify PARTIALLY_FILLED status
    console.log("Waiting for first partial fill...");
    const { order: firstPartiallyFilledOrder } =
      await waitForOrderToBePartiallyFilled(dynamicLimitOrderOuid, makerToken);

    console.log(
      `Dynamic Limit order after first match - Status: ${firstPartiallyFilledOrder.status}, Executed: ${firstPartiallyFilledOrder.executed_quantity}/${firstPartiallyFilledOrder.quantity}`,
    );

    expect(firstPartiallyFilledOrder.ouid).toBe(dynamicLimitOrderOuid);
    expect(firstPartiallyFilledOrder.status).toBe("PARTIALLY_FILLED");
    expect(Number(firstPartiallyFilledOrder.executed_quantity)).toBeCloseTo(
      firstPartialQuantity,
      2, // Allow small rounding differences
    );
    expect(firstPartiallyFilledOrder.type).toBe("DYNAMIC_LIMIT");
    expect(firstPartiallyFilledOrder.direction).toBe("ASK");

    // 4. Verify first trade was created
    const firstTrade = await verifyMakerTrade(
      dynamicLimitOrderOuid,
      firstPartialQuantity,
      symbol,
      "ASK",
      "Dynamic Limit Sell",
      makerToken,
    );

    // 5. Create Second Market Buy Order for additional partial fill
    console.log(
      "Creating Second Market Buy Order for additional partial fill...",
    );

    const secondMarketOrderOuid = await createOppositeMarketIOCOrder(
      {
        ...orderPayload,
        quantity: secondPartialQuantity,
      },
      takerToken,
      true, // Add flag to indicate this is for dynamic limit matching
    );

    // Verify second market order was created
    const { body: secondMarketOrderListBody } = await waitForOrderInList(
      secondMarketOrderOuid,
      takerToken,
    );
    const secondMarketOrder = secondMarketOrderListBody.content[0];
    console.log(
      `Second market order is in system with status: ${secondMarketOrder.status}`,
    );

    // 6. Wait for second partial fill and verify updated PARTIALLY_FILLED status
    console.log("Waiting for second partial fill...");

    // Calculate expected total executed quantity after second fill
    const totalExecuted = firstPartialQuantity + secondPartialQuantity;

    // Wait for the order to be updated with the new executed quantity
    const { order: secondPartiallyFilledOrder } =
      await waitForOrderExecutedQuantity(
        dynamicLimitOrderOuid,
        makerToken,
        totalExecuted,
      );

    console.log(
      `Dynamic Limit order after second match - Status: ${secondPartiallyFilledOrder.status}, Executed: ${secondPartiallyFilledOrder.executed_quantity}/${secondPartiallyFilledOrder.quantity}`,
    );

    expect(secondPartiallyFilledOrder.ouid).toBe(dynamicLimitOrderOuid);
    expect(secondPartiallyFilledOrder.status).toBe("PARTIALLY_FILLED");
    expect(Number(secondPartiallyFilledOrder.executed_quantity)).toBeCloseTo(
      totalExecuted,
      2, // Allow small rounding differences
    );
    expect(Number(secondPartiallyFilledOrder.quantity)).toBeCloseTo(
      totalQuantity,
      2,
    );

    // 7. Verify second trade was created
    const secondTrade = await verifyMakerTrade(
      dynamicLimitOrderOuid,
      secondPartialQuantity,
      symbol,
      "ASK",
      "Dynamic Limit Sell",
      makerToken,
    );

    // Verify we have two distinct trades
    expect(firstTrade.tuid).not.toBe(secondTrade.tuid);

    // 8. Final summary - order remains partially filled
    const remainingQuantity = totalQuantity - totalExecuted;
    console.log("\n=== Final Summary ===");
    console.log(`Dynamic Limit Sell Order: ${dynamicLimitOrderOuid}`);
    console.log(`Total Quantity: ${totalQuantity} ${baseCurrency}`);
    console.log(`Partially Filled: ${totalExecuted} ${baseCurrency}`);
    console.log(`Remaining: ${remainingQuantity} ${baseCurrency}`);
    console.log(`Status: ${secondPartiallyFilledOrder.status}`);
    console.log(`Trades:`);
    console.log(
      `  1. ${firstTrade.tuid}: ${firstTrade.quantity} ${baseCurrency} at ${firstTrade.price} ${quoteCurrency}`,
    );
    console.log(
      `  2. ${secondTrade.tuid}: ${secondTrade.quantity} ${baseCurrency} at ${secondTrade.price} ${quoteCurrency}`,
    );
    console.log(
      `Total Executed: ${secondPartiallyFilledOrder.executed_quantity} ${baseCurrency}`,
    );
    console.log(
      `Final Status: ${secondPartiallyFilledOrder.status} (Partially Filled)`,
    );
  });

  test.afterAll(async () => {
    // Cleanup services using the reusable function
    await restoreServices(serviceConfig);
  });
});
