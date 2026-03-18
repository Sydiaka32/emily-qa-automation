import { test } from "@playwright/test";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { config } from "../../../test.config";
import { postOrder } from "@utils/apiUtils";
import { ServiceConfiguration } from "@utils/exchangeService/orderBook/verifyCurrencyPairExists";
import { currencyPairRecreation } from "@utils/exchangeService/settings/currencyPairRecreation";
import { configureServicesForDynamicLimit } from "@utils/coreService/services/configureServiceForDynamicLimit";
import { createOrder } from "@utils/exchangeService/order/createOrder";
import { verifyOrderCreationResponse } from "@utils/exchangeService/order/verifyOrderCreationResponse";
import { waitForOrderInList } from "@utils/exchangeService/order/waitForOrderInList";
import { verifyOrderInList } from "@utils/exchangeService/order/verifyOrderInList";
import { restoreServices } from "@utils/coreService/services/restoreServices";

test.describe("Dynamic Limit Orders - GTC ASK with Service Management", () => {
  let memberToken: string;
  let operatorToken: string;
  let serviceConfig: ServiceConfiguration;
  const baseCurrency = "SAR";
  const quoteCurrency = "BRL";

  test.beforeAll(async () => {
    console.log("Getting authentication tokens...");

    // Get member token for order creation (using member portal auth)
    memberToken = await getAccessToken(config.memberName, config.password);
    console.log("Member token obtained successfully");

    // Get operator token for service management (using backoffice auth)
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained successfully");

    // Pre-condition for delete all existing orders and create a clean order book
    await currencyPairRecreation(
      baseCurrency,
      quoteCurrency,
      operatorToken,
      memberToken,
    );

    // Configure services for Dynamic Limit orders using the reusable function
    serviceConfig = await configureServicesForDynamicLimit(
      config.memberXmi,
      operatorToken,
    );
  });

  test("New Dynamic Limit sell GTC - Order is created with LP service", async () => {
    // MAIN TEST: Create Dynamic Limit order
    console.log("\n=== Creating Dynamic Limit Order ===");

    // 1. Create the Dynamic Limit GTC ASK order payload
    const orderPayload = createOrder("DYNAMIC_LIMIT", "GTC", "ASK");

    console.log("Creating Dynamic Limit Sell GTC Order:");
    console.log("Payload:", JSON.stringify(orderPayload, null, 2));

    // 2. Send POST request to create the Dynamic Limit order
    const { response, body } = await postOrder(
      "/api/v1/orders/create",
      orderPayload,
      memberToken,
    );

    // 3. Verify order creation response using reusable function
    const createdOrderOuid = verifyOrderCreationResponse(response, body);

    console.log(
      `Dynamic Limit GTC ASK order created with OUID: ${createdOrderOuid}`,
    );

    // 4. Wait for order to appear in list and verify using reusable function
    const { body: orderBody } = await waitForOrderInList(
      createdOrderOuid,
      memberToken,
    );

    const foundOrder = verifyOrderInList(
      orderBody,
      createdOrderOuid,
      orderPayload,
    );

    // 5. Additional verifications specific to dynamic limit orders
    console.log(`Order direction: ${foundOrder.direction}`);
    console.log(`Order constraint: ${foundOrder.constraint}`);
    console.log(`Order type: ${foundOrder.type}`);
    console.log(`Order executed quantity: ${foundOrder.executed_quantity}`);

    console.log("Order Summary:");
    console.log(`   - Type: Dynamic Limit GTC Sell`);
    console.log(
      `   - Selling: ${orderPayload.quantity} ${orderPayload.left_currency}`,
    );
    console.log(`   - Price: ${foundOrder.price}`);
    console.log(`   - Status: ${foundOrder.status}`);
  });

  test.afterAll(async () => {
    // Cleanup services using the reusable function
    await restoreServices(serviceConfig);
  });
});
