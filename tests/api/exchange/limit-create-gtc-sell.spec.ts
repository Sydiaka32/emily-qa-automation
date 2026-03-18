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

test.describe("Limit Orders", () => {
  let memberToken: string;
  let operatorToken: string;
  const baseCurrency = "SAR";
  const quoteCurrency = "BRL";
  let serviceConfig: ServiceConfiguration;

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

    // Configure services for standard orders
    serviceConfig = await configureServicesForStandardOrders(
      config.memberXmi,
      operatorToken,
    );
  });

  test("New Limit sell GTC - Order is created", async () => {
    // 1. Create the order payload
    const orderPayload = createOrder("LIMIT", "GTC", "ASK");

    console.log("Creating Limit Sell GTC Order:");
    console.log("Payload:", JSON.stringify(orderPayload, null, 2));

    // 2. Send POST request to create order
    const { response, body } = await postOrder(
      "/api/v1/orders/create",
      orderPayload,
      memberToken,
    );

    // 3. Verify order creation response
    const createdOrderOuid = verifyOrderCreationResponse(response, body);

    // 4. Wait for order to appear in list and verify
    const { body: orderBody } = await waitForOrderInList(
      createdOrderOuid,
      memberToken,
    );

    verifyOrderInList(orderBody, createdOrderOuid, orderPayload);
  });
});
