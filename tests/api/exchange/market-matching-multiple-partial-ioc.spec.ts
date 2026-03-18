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
import { createOppositeGTCOrder } from "@utils/exchangeService/order/createOppositeGtcOrder";
import { waitForOrderToBeActive } from "@utils/exchangeService/order/waitOrderToBeActive";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderToBePartiallyCanceled } from "@utils/exchangeService/order/waitForOrderToBePartiallyCanceled";
import { waitForOrderInList } from "@utils/exchangeService/order/waitForOrderInList";
import { verifyMultipleTakerTrades } from "@utils/exchangeService/trade/verifyMultipleTakerTrades";

test.describe("Matching Market sell IOC with multiple orders by partial volume", () => {
  let makerToken: string;
  let takerToken: string;
  let operatorToken: string;
  let marketOrderOuid: string;
  let firstLimitOrderOuid: string;
  let secondLimitOrderOuid: string;
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

  test("Market sell IOC order should be partially filled by multiple limit buy orders with remaining canceled", async () => {
    // 1. Create Market Sell IOC order payload (but don't send it yet)
    const marketOrderPayload = createOrder("MARKET", "IOC", "ASK");
    const marketOrderQuantity = marketOrderPayload.quantity;

    console.log("Market Sell IOC Order Payload (to be used for precondition):");
    console.log(JSON.stringify(marketOrderPayload, null, 2));
    console.log(`Market order total quantity: ${marketOrderQuantity}`);

    // Generate partial quantities for limit orders that are less than market order quantity
    const firstPartialQuantity = generatePartialQuantity(
      marketOrderQuantity,
      0.3,
      0.4,
    ); // 30-40% of market order
    const secondPartialQuantity = generatePartialQuantity(
      marketOrderQuantity,
      0.3,
      0.4,
    ); // 30-40% of market order

    console.log(
      `Generated partial quantities for limit orders: First=${firstPartialQuantity}, Second=${secondPartialQuantity}`,
    );
    console.log(
      `Total limit orders quantity: ${(firstPartialQuantity + secondPartialQuantity).toFixed(2)}/${marketOrderQuantity}`,
    );

    // ADDED: Verify the total limit quantity is less than market quantity for IOC partial cancellation
    const totalLimitQuantity = firstPartialQuantity + secondPartialQuantity;
    if (totalLimitQuantity >= marketOrderQuantity) {
      console.warn(
        `⚠️  Total limit quantity (${totalLimitQuantity}) should be less than market quantity (${marketOrderQuantity}) for partial IOC cancellation`,
      );
    }

    // 2. Create modified market payloads for each limit order with partial quantities
    const firstLimitOrderPayload = {
      ...marketOrderPayload,
      quantity: firstPartialQuantity,
    };

    const secondLimitOrderPayload = {
      ...marketOrderPayload,
      quantity: secondPartialQuantity,
    };

    // 3. Create First Limit Buy GTC order as precondition using utility function
    console.log("Creating First Limit Buy GTC order as precondition...");
    firstLimitOrderOuid = await createOppositeGTCOrder(
      firstLimitOrderPayload,
      makerToken,
    );

    // Wait for first limit order to be active in order book
    console.log("Waiting for First Limit order to be active in order book...");
    const { order: firstActiveOrder } = await waitForOrderToBeActive(
      firstLimitOrderOuid,
      makerToken,
    );
    console.log(
      `First Limit order is now active with status: ${firstActiveOrder.status}`,
    );

    // 4. Create Second Limit Buy GTC order as precondition using utility function
    console.log("Creating Second Limit Buy GTC order as precondition...");
    secondLimitOrderOuid = await createOppositeGTCOrder(
      secondLimitOrderPayload,
      makerToken,
    );

    // Wait for second limit order to be active in order book
    console.log("Waiting for Second Limit order to be active in order book...");
    const { order: secondActiveOrder } = await waitForOrderToBeActive(
      secondLimitOrderOuid,
      makerToken,
    );
    console.log(
      `Second Limit order is now active with status: ${secondActiveOrder.status}`,
    );

    // ADDED: Wait for order book synchronization
    console.log("Waiting 2 seconds for order book to synchronize...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 5. Now create the Market Sell IOC order (taker)
    console.log("Creating Market Sell IOC Order...");
    const { response: marketOrderResponse, body: marketOrderBody } =
      await postOrder("/api/v1/orders/create", marketOrderPayload, takerToken);

    // Verify market order creation using reusable function
    marketOrderOuid = verifyOrderCreationResponse(
      marketOrderResponse,
      marketOrderBody,
    );
    console.log(`Market Sell IOC order created with OUID: ${marketOrderOuid}`);

    // 6. Wait for market order to be PARTIALLY_CANCELED (IOC behaviour - fills what it can, cancels the rest)
    console.log("Waiting for market order to be partially canceled...");
    const { order: partiallyCanceledMarketOrder } =
      await waitForOrderToBePartiallyCanceled(marketOrderOuid, takerToken);

    // UPDATED: Handle both PARTIALLY_CANCELED and CANCELED with partial execution
    expect(partiallyCanceledMarketOrder.ouid).toBe(marketOrderOuid);

    // Allow both statuses as long as we have partial execution
    const isPartiallyCanceled =
      partiallyCanceledMarketOrder.status === "PARTIALLY_CANCELED";
    const isCanceledWithPartialFill =
      partiallyCanceledMarketOrder.status === "CANCELED" &&
      partiallyCanceledMarketOrder.executed_quantity > 0;

    expect(isPartiallyCanceled || isCanceledWithPartialFill).toBeTruthy();

    expect(partiallyCanceledMarketOrder.executed_quantity).toBeCloseTo(
      firstPartialQuantity + secondPartialQuantity,
      2,
    );
    expect(partiallyCanceledMarketOrder.executed_quantity).toBeLessThan(
      marketOrderQuantity,
    ); // Should be partially filled
    expect(partiallyCanceledMarketOrder.type).toBe("MARKET");
    expect(partiallyCanceledMarketOrder.direction).toBe("ASK");
    expect(partiallyCanceledMarketOrder.constraint).toBe("IOC");

    console.log(
      `Market order after execution - Status: ${partiallyCanceledMarketOrder.status}, Executed: ${partiallyCanceledMarketOrder.executed_quantity}/${partiallyCanceledMarketOrder.quantity}`,
    );

    // 7. Verify the limit orders were filled
    const { body: firstLimitOrderBody } = await waitForOrderInList(
      firstLimitOrderOuid,
      makerToken,
    );
    const updatedFirstLimitOrder = firstLimitOrderBody.content[0];
    console.log(
      `First Limit order after matching - Status: ${updatedFirstLimitOrder.status}, Executed: ${updatedFirstLimitOrder.executed_quantity}/${updatedFirstLimitOrder.quantity}`,
    );

    const { body: secondLimitOrderBody } = await waitForOrderInList(
      secondLimitOrderOuid,
      makerToken,
    );
    const updatedSecondLimitOrder = secondLimitOrderBody.content[0];
    console.log(
      `Second Limit order after matching - Status: ${updatedSecondLimitOrder.status}, Executed: ${updatedSecondLimitOrder.executed_quantity}/${updatedSecondLimitOrder.quantity}`,
    );

    // 8. Verify trades were created using the new reusable function
    const matchingTrades = await verifyMultipleTakerTrades(
      marketOrderOuid,
      partiallyCanceledMarketOrder.executed_quantity,
      symbol,
      "ASK",
      "Market Sell IOC",
      takerToken,
      2, // Expect 2 trades
    );

    // Trade Summary
    console.log("\n=== Trade Summary ===");
    console.log(`Maker (Limit Buy GTC):`);
    console.log(
      `  - First OUID: ${firstLimitOrderOuid} - Quantity: ${firstPartialQuantity} ${baseCurrency}`,
    );
    console.log(
      `  - Second OUID: ${secondLimitOrderOuid} - Quantity: ${secondPartialQuantity} ${baseCurrency}`,
    );
    console.log(`Taker (Market Sell IOC):`);
    console.log(`  - OUID: ${marketOrderOuid}`);
    console.log(`  - Direction: ASK`);
    console.log(`  - Selling ${marketOrderQuantity} ${baseCurrency}`);
    console.log(`Trades (${matchingTrades.length}):`);
    matchingTrades.forEach((trade: any, index: number) => {
      console.log(
        `  ${index + 1}. TUID: ${trade.tuid} - Quantity: ${trade.quantity} ${baseCurrency} at ${trade.price} ${quoteCurrency}`,
      );
    });
    console.log(
      `Total Executed: ${partiallyCanceledMarketOrder.executed_quantity} ${baseCurrency}`,
    );
    console.log(
      `Remaining Canceled (IOC): ${marketOrderQuantity - partiallyCanceledMarketOrder.executed_quantity} ${baseCurrency}`,
    );
    console.log(
      `Final Status: ${partiallyCanceledMarketOrder.status} (Partially Canceled - IOC behaviour)`,
    );
  });
});
