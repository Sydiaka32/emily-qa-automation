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
import { configureServicesForStandardOrders } from "@utils/coreService/services/configureServicesForStandartOrders";
import { createOrder } from "@utils/exchangeService/order/createOrder";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderToBeActive } from "@utils/exchangeService/order/waitOrderToBeActive";
import { createOppositeMarketIOCOrder } from "@utils/exchangeService/order/createOppositeMarketIocOrder";
import { waitForOrderToBePartiallyFilled } from "@utils/exchangeService/order/waitForOrderToBePartiallyFilled";
import { verifyMakerTrade } from "@utils/exchangeService/trade/verifyMakerTrade";
import { waitForOrderExecutedQuantity } from "@utils/exchangeService/order/waitForOrderExecutedQuantity";
import { verifyMultipleTradesForOrder } from "@utils/exchangeService/trade/verifyMultipleTradesForOrder";
import { restoreServices } from "@utils/coreService/services/restoreServices";

test.describe("Matching Spot sell GTC with multiple orders by partial volume", () => {
  let makerToken: string;
  let takerToken: string;
  let operatorToken: string;
  let spotOrderOuid: string;
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

  test("Spot sell GTC order should be partially filled by multiple market buy orders", async () => {
    // 1. Create Spot Sell GTC order with generated quantity
    const orderPayload = createOrder("SPOT_OUTRIGHT", "GTC", "ASK");

    console.log("Creating Spot Sell GTC Order...");
    const { response: spotOrderResponse, body: spotOrderBody } =
      await postOrder("/api/v1/orders/create", orderPayload, makerToken);

    console.log("Response body:", JSON.stringify(spotOrderBody, null, 2));

    // Verify order creation
    spotOrderOuid = verifyOrderCreationResponse(
      spotOrderResponse,
      spotOrderBody,
    );
    console.log(`Spot Sell GTC order created with OUID: ${spotOrderOuid}`);

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

    const totalQuantity = orderPayload.quantity;
    console.log(`Spot order total quantity: ${totalQuantity}`);

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

    console.log(
      `Generated partial quantities: First=${firstPartialQuantity}, Second=${secondPartialQuantity}`,
    );
    console.log(
      `Total after both fills: ${(firstPartialQuantity + secondPartialQuantity).toFixed(2)}/${totalQuantity}`,
    );

    // 2. Create First Market Buy Order to partially match
    console.log("Creating First Market Buy Order for partial fill...");
    const firstPartialOrderPayload = {
      ...orderPayload,
      quantity: firstPartialQuantity,
    };

    // ADDED: Additional synchronization before first market order
    console.log("Waiting 1 second before creating first market order...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await createOppositeMarketIOCOrder(firstPartialOrderPayload, takerToken);

    // 3. Wait for first partial fill and verify PARTIALLY_FILLED status
    console.log("Waiting for first partial fill...");
    const { order: firstPartiallyFilledOrder } =
      await waitForOrderToBePartiallyFilled(spotOrderOuid, makerToken);

    console.log(
      `Spot order after first match - Status: ${firstPartiallyFilledOrder.status}, Executed: ${firstPartiallyFilledOrder.executed_quantity}/${firstPartiallyFilledOrder.quantity}`,
    );

    expect(firstPartiallyFilledOrder.ouid).toBe(spotOrderOuid);
    expect(firstPartiallyFilledOrder.status).toBe("PARTIALLY_FILLED");
    expect(firstPartiallyFilledOrder.executed_quantity).toBeCloseTo(
      firstPartialQuantity,
      2,
    );
    expect(firstPartiallyFilledOrder.type).toBe("SPOT_OUTRIGHT");
    expect(firstPartiallyFilledOrder.direction).toBe("ASK");

    // 4. Verify first trade was created using utility function
    console.log("Verifying first trade...");
    await verifyMakerTrade(
      spotOrderOuid,
      firstPartialQuantity,
      symbol,
      "ASK",
      "Spot Sell GTC",
      makerToken,
    );

    // 5. Create Second Market Buy Order for additional partial fill
    console.log(
      "Creating Second Market Buy Order for additional partial fill...",
    );
    const secondPartialOrderPayload = {
      ...orderPayload,
      quantity: secondPartialQuantity,
    };

    // ADDED: Additional synchronization before second market order
    console.log("Waiting 1 second before creating second market order...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await createOppositeMarketIOCOrder(secondPartialOrderPayload, takerToken);

    // 6. Wait for second partial fill and verify updated PARTIALLY_FILLED status
    console.log("Waiting for second partial fill...");

    // Calculate expected total executed quantity after second fill
    const totalExecuted = firstPartialQuantity + secondPartialQuantity;

    // Wait for the order to be updated with the new executed quantity
    const { order: secondPartiallyFilledOrder } =
      await waitForOrderExecutedQuantity(
        spotOrderOuid,
        makerToken,
        totalExecuted,
      );

    console.log(
      `Spot order after second match - Status: ${secondPartiallyFilledOrder.status}, Executed: ${secondPartiallyFilledOrder.executed_quantity}/${secondPartiallyFilledOrder.quantity}`,
    );

    expect(secondPartiallyFilledOrder.ouid).toBe(spotOrderOuid);
    expect(secondPartiallyFilledOrder.status).toBe("PARTIALLY_FILLED");
    expect(secondPartiallyFilledOrder.executed_quantity).toBeCloseTo(
      totalExecuted,
      2,
    );
    expect(secondPartiallyFilledOrder.quantity).toBe(totalQuantity);

    // 7. Verify both trades using the multiple trades utility function
    console.log("Verifying both trades together...");
    const trades = await verifyMultipleTradesForOrder(
      spotOrderOuid,
      totalExecuted, // expected total quantity from both trades
      symbol,
      true, // is_maker: true for spot order
      "ASK", // order direction
      "Spot Sell GTC", // order type
      makerToken,
      2, // expected number of trades
    );

    // 8. Final summary - order remains partially filled
    const remainingQuantity = totalQuantity - totalExecuted;
    console.log("\n=== Final Summary ===");
    console.log(`Spot Sell Order: ${spotOrderOuid}`);
    console.log(`Total Quantity: ${totalQuantity} ${baseCurrency}`);
    console.log(`Partially Filled: ${totalExecuted} ${baseCurrency}`);
    console.log(`Remaining: ${remainingQuantity} ${baseCurrency}`);
    console.log(`Status: ${secondPartiallyFilledOrder.status}`);
    console.log(`Trades:`);
    trades.forEach((trade: any, index: number) => {
      console.log(
        `  ${index + 1}. ${trade.tuid}: ${trade.quantity} ${baseCurrency} at ${trade.price} ${quoteCurrency}`,
      );
    });
    console.log(
      `Total Executed: ${secondPartiallyFilledOrder.executed_quantity} ${baseCurrency}`,
    );
    console.log(
      `Final Status: ${secondPartiallyFilledOrder.status} (Partially Filled)`,
    );
  });

  test.afterAll(async () => {
    // Restore services to original state
    await restoreServices(serviceConfig);
  });
});
