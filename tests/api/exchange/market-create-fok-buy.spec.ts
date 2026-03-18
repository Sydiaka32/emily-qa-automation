import { expect, test } from "@playwright/test";
import {
  getAccessToken,
  getOperatorToken,
} from "@utils/auth";
import { config } from "../../../test.config";
import { postOrder } from "@utils/apiUtils/market/postOrder";
import { ServiceConfiguration } from "@utils/exchangeService/orderBook/verifyCurrencyPairExists";
import { configureServicesForStandardOrders } from "@utils/coreService/services/configureServicesForStandartOrders";
import { currencyPairRecreation } from "@utils/exchangeService/settings/currencyPairRecreation";
import { createOrder } from "@utils/exchangeService/order/createOrder";
import { createOppositeGTCOrder } from "@utils/exchangeService/order/createOppositeGtcOrder";
import { waitForOrderToBeActive } from "@utils/exchangeService/order/waitOrderToBeActive";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderInList } from "@utils/exchangeService/order/waitForOrderInList";
import { verifyOrderInList } from "@utils/exchangeService/order/verifyOrderInList";
import { waitForFOKOrderExecution } from "../../../utils/exchangeService/order/waitForFOKOrderExecution";

test.describe("Market Orders - FOK BID with Maker/Taker", () => {
  let makerToken: string; // For GTC precondition order
  let takerToken: string; // For FOK main order
  let preconditionOrderOuid: string;
  let operatorToken: string;
  const baseCurrency = "SAR";
  const quoteCurrency = "BRL";
  let serviceConfig: ServiceConfiguration;
  let fokOrderPayload: any; // ADDED: Store the FOK order payload

  test.beforeAll(async () => {
    console.log("Getting authentication tokens for both members...");

    // Maker creates the GTC precondition order
    makerToken = await getAccessToken(config.memberName, config.password);
    console.log("Maker token obtained successfully");

    // Taker executes the FOK order
    takerToken = await getAccessToken(config.takerName, config.password);
    console.log("Taker token obtained successfully");

    // Get operator token for service management (using backoffice auth)
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    // Configure services for standard orders
    serviceConfig = await configureServicesForStandardOrders(
      config.memberXmi,
      operatorToken,
    );

    // Pre-condition for delete all existing orders and create a clean order book
    await currencyPairRecreation(
      baseCurrency,
      quoteCurrency,
      operatorToken,
      makerToken,
    );

    // Create precondition order in beforeAll so it's ready before the test runs
    console.log("Setting up precondition GTC ASK order...");

    // CHANGED: Create the FOK order payload first and store it
    fokOrderPayload = createOrder("MARKET", "FOK", "BID");
    console.log(`FOK order will use quantity: ${fokOrderPayload.quantity} SAR`);

    // Create opposite GTC ASK order as precondition (opposite of BID)
    // Use the SAME quantity as the FOK order
    preconditionOrderOuid = await createOppositeGTCOrder(
      fokOrderPayload, // Use the actual FOK payload to ensure matching quantity
      makerToken,
    );

    const { order: activeOrder } = await waitForOrderToBeActive(
      preconditionOrderOuid,
      makerToken,
    );
    console.log(
      `Precondition GTC order is now active with status: ${activeOrder.status}`,
    );

    // ADDED: Verify quantities match
    console.log("=== Quantity Verification ===");
    console.log(`Precondition GTC Order Quantity: ${activeOrder.quantity} SAR`);
    console.log(`FOK Market Order Quantity: ${fokOrderPayload.quantity} SAR`);

    if (activeOrder.quantity !== fokOrderPayload.quantity) {
      console.warn(
        `QUANTITY MISMATCH: Precondition (${activeOrder.quantity}) vs FOK (${fokOrderPayload.quantity})`,
      );
    } else {
      console.log("Quantities match - FOK order should execute successfully");
    }

    // Wait for order book synchronization
    console.log(
      "Waiting 2 seconds for precondition order to be available in order book...",
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(
      `Precondition GTC ASK order setup complete with OUID: ${preconditionOrderOuid}`,
    );
  });

  test("New Market buy FOK - Order is created and executes against GTC order", async () => {
    // Additional synchronization at test start
    console.log("Waiting 1 second to ensure order book is stable...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Use the pre-created FOK order payload
    console.log("Creating Market Buy FOK Order:");
    console.log("Payload:", JSON.stringify(fokOrderPayload, null, 2));

    // Send POST request to create the main Market FOK BID order (taker)
    const { response, body } = await postOrder(
      "/api/v1/orders/create",
      fokOrderPayload,
      takerToken,
    );

    // Verify order creation response using reusable function
    const createdOrderOuid = verifyOrderCreationResponse(response, body);

    console.log(
      `Main Market FOK BID order created with OUID: ${createdOrderOuid}`,
    );

    console.log("Waiting for FOK order to execute...");
    const { order: executedOrder } = await waitForFOKOrderExecution(
      createdOrderOuid,
      takerToken,
      30000, // Increased timeout to 30 seconds
      500,
    );

    console.log(`FOK order execution status: ${executedOrder.status}`);
    console.log(
      `FOK order executed quantity: ${executedOrder.executed_quantity}`,
    );

    // Wait for order to appear in list and verify
    const { body: orderBody } = await waitForOrderInList(
      createdOrderOuid,
      takerToken,
    );

    const foundOrder = verifyOrderInList(
      orderBody,
      createdOrderOuid,
      fokOrderPayload,
    );

    // Additional verifications specific to FOK orders
    console.log(`Order direction: ${foundOrder.direction}`);
    console.log(`Order constraint: ${foundOrder.constraint}`);
    console.log(`Order executed quantity: ${foundOrder.executed_quantity}`);

    // Verify FOK order was actually filled
    if (foundOrder.executed_quantity !== foundOrder.quantity) {
      console.warn(
        `FOK order not fully filled: ${foundOrder.executed_quantity}/${foundOrder.quantity}`,
      );
      console.warn(
        `This indicates the precondition order wasn't available or there was a matching issue`,
      );
    }

    console.log("Order Summary:");
    console.log(`   - Type: Market FOK Buy`);
    console.log(
      `   - Buying: ${fokOrderPayload.quantity} ${fokOrderPayload.left_currency}`,
    );
    console.log(`   - Status: ${foundOrder.status}`);
    console.log(
      `   - Executed: ${foundOrder.executed_quantity}/${foundOrder.quantity}`,
    );

    // Verify the order was filled (FOK should be either fully filled or rejected)
    expect(foundOrder.executed_quantity).toBe(foundOrder.quantity);
    expect(foundOrder.status).toBe("FILLED");
  });
});
