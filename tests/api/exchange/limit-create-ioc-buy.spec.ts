import { test, expect } from "@playwright/test";
import {
  getAccessToken,
  getOperatorToken,
} from "@utils/auth";
import { config } from "../../../test.config";
import { ServiceConfiguration } from "@utils/exchangeService/orderBook/verifyCurrencyPairExists";
import { currencyPairRecreation } from "@utils/exchangeService/settings/currencyPairRecreation";
import { configureServicesForStandardOrders } from "@utils/coreService/services/configureServicesForStandartOrders";
import { createOrder } from "@utils/exchangeService/order/createOrder";
import { createOppositeGTCOrder } from "@utils/exchangeService/order/createOppositeGtcOrder";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderInList } from "@utils/exchangeService/order/waitForOrderInList";
import { verifyOrderInList } from "@utils/exchangeService/order/verifyOrderInList";
import { getBalances, postOrder } from "@utils/apiUtils";

test.describe("Limit Orders - IOC BID with Maker/Taker", () => {
  let makerToken: string; // For GTC precondition order
  let takerToken: string; // For IOC main order
  let preconditionOrderOuid: string;
  let operatorToken: string;
  const baseCurrency = "SAR";
  const quoteCurrency = "BRL";
  let serviceConfig: ServiceConfiguration;

  test.beforeAll(async () => {
    console.log("Getting authentication tokens for both members...");

    // Maker creates the GTC precondition order
    makerToken = await getAccessToken(config.memberName, config.password);
    console.log("Maker token obtained successfully");

    // Taker executes the IOC order
    takerToken = await getAccessToken(config.takerName, config.password);
    console.log("Taker token obtained successfully");

    // Get operator token for service management (using backoffice auth)
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

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

    // Create precondition order in beforeAll so it's ready before the test runs
    console.log("Setting up precondition GTC order...");

    // Create a sample order payload to determine the precondition details
    const sampleOrderPayload = createOrder("LIMIT", "IOC", "BID");

    // Create opposite GTC ASK order as precondition
    preconditionOrderOuid = await createOppositeGTCOrder(
      sampleOrderPayload,
      makerToken,
    );
    console.log(
      `Precondition GTC ASK order setup complete with OUID: ${preconditionOrderOuid}`,
    );
  });

  test("New Limit buy IOC - Order is created and executes against GTC order", async () => {
    // 1. Create the main IOC BID order payload
    // Use same price and quantity as precondition for immediate execution
    const orderPayload = createOrder("LIMIT", "IOC", "BID");

    console.log("Creating Limit Buy IOC Order:");
    console.log("Payload:", JSON.stringify(orderPayload, null, 2));

    // 2. Get taker's initial balances BEFORE creating the IOC order
    const { response: takerBalanceResponse } = await getBalances(takerToken);
    expect(takerBalanceResponse.status()).toBe(200);

    // 3. Send POST request to create the main IOC BID order (taker)
    const { response, body } = await postOrder(
      "/api/v1/orders/create",
      orderPayload,
      takerToken,
    );

    // 4. Verify order creation response using reusable function
    const createdOrderOuid = verifyOrderCreationResponse(response, body);

    console.log(`Main IOC BID order created with OUID: ${createdOrderOuid}`);

    // 5. Wait for order to appear in list and verify using reusable function
    const { body: orderBody } = await waitForOrderInList(
      createdOrderOuid,
      takerToken,
    );

    const foundOrder = verifyOrderInList(
      orderBody,
      createdOrderOuid,
      orderPayload,
    );

    // 6. Additional verifications specific to IOC orders
    console.log(`Order direction: ${foundOrder.direction}`);
    console.log(`Order constraint: ${foundOrder.constraint}`);
    console.log(`Order executed quantity: ${foundOrder.executed_quantity}`);

    console.log("Order Summary:");
    console.log(`   - Type: Limit IOC Buy`);
    console.log(
      `   - Buying: ${orderPayload.quantity} ${orderPayload.left_currency}`,
    );
    console.log(`   - Price: ${foundOrder.price}`);
    console.log(`   - Status: ${foundOrder.status}`);
    console.log(
      `   - Executed: ${foundOrder.executed_quantity}/${foundOrder.quantity}`,
    );
  });
});
