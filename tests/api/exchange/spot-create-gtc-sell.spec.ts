import { test } from "@playwright/test";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { config } from "../../../test.config";
import { postOrder } from "@utils/apiUtils";
import { ServiceConfiguration } from "@utils/exchangeService/orderBook/verifyCurrencyPairExists";
import { currencyPairRecreation } from "@utils/exchangeService/settings/currencyPairRecreation";
import { configureServicesForStandardOrders } from "@utils/coreService/services/configureServicesForStandartOrders";
import { createOrder } from "@utils/exchangeService/order/createOrder";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderInList } from "@utils/exchangeService/order/waitForOrderInList";
import { verifyOrderInList } from "@utils/exchangeService/order/verifyOrderInList";
import { restoreServices } from "@utils/coreService/services/restoreServices";

test.describe("Spot Outright Orders - GTC ASK", () => {
  let makerToken: string;
  let operatorToken: string;
  const baseCurrency = "SAR";
  const quoteCurrency = "BRL";
  let serviceConfig: ServiceConfiguration;

  test.beforeAll(async () => {
    console.log("Getting authentication token...");
    makerToken = await getAccessToken(config.memberName, config.password);
    console.log("Token obtained successfully");

    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password, // Fixed: removed extra comma and characters
    );

    // Pre-condition for delete all existing orders and create a clean order book
    await currencyPairRecreation(
      baseCurrency,
      quoteCurrency,
      operatorToken, // Fixed: removed extra characters
      makerToken,
    );

    // Configure services for standard orders
    serviceConfig = await configureServicesForStandardOrders(
      config.memberXmi,
      operatorToken, // Fixed: removed extra characters
    );
  });

  test("New Spot sell GTC - Order is created", async () => {
    // 1. Create the Spot GTC ASK order payload
    const orderPayload = createOrder("SPOT_OUTRIGHT", "GTC", "ASK");

    console.log("Creating Spot Sell GTC Order:");
    console.log("Payload:", JSON.stringify(orderPayload, null, 2));

    // 2. Send POST request to create the Spot GTC ASK order
    const { response, body } = await postOrder(
      "/api/v1/orders/create",
      orderPayload, // Fixed: removed extra characters
      makerToken,
    );

    // 3. Verify order creation using reusable function
    const createdOrderOuid = verifyOrderCreationResponse(response, body);

    console.log(`Spot GTC ASK order created with OUID: ${createdOrderOuid}`);

    // 4. Wait for order to appear in list and verify using reusable function
    const { body: orderBody } = await waitForOrderInList(
      createdOrderOuid, // Fixed: removed extra characters
      makerToken,
    );

    const foundOrder = verifyOrderInList(
      orderBody,
      createdOrderOuid, // Fixed: removed extra characters
      orderPayload,
    );

    // 5. Additional verifications specific to spot orders
    console.log(`Order direction: ${foundOrder.direction}`);
    console.log(`Order constraint: ${foundOrder.constraint}`);
    console.log(`Order type: ${foundOrder.type}`);
    console.log(`Order expire at: ${foundOrder.expire_at}`);
    console.log(`Order executed quantity: ${foundOrder.executed_quantity}`);

    console.log("Order Summary:");
    console.log(`   - Type: Spot Outright GTC Sell`);
    console.log(
      `   - Selling: ${orderPayload.quantity} ${orderPayload.left_currency}`,
    ); // Fixed: removed extra characters
    console.log(`   - Expires: ${foundOrder.expire_at}`);
    console.log(`   - Status: ${foundOrder.status}`);
  });

  // Added missing afterAll hook for cleanup
  test.afterAll(async () => {
    await restoreServices(serviceConfig);
  });
});
