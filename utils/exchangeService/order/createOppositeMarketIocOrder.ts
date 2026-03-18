// utils/exchangeService/order/createOppositeMarketIOCOrder.ts
import { postOrder } from "@utils/apiUtils";
import { waitForOrderInFeed } from "../orderBook/waitForOrderInFeed";

export async function createOppositeMarketIOCOrder(
  limitOrderPayload: any,
  token: string,
  isDynamicLimit: boolean = false,
): Promise<string> {
  console.log(
    "Creating opposite Market IOC order to match with limit order...",
  );

  // Determine opposite direction
  const oppositeDirection =
    limitOrderPayload.direction === "BID" ? "ASK" : "BID";
  const symbol = `${limitOrderPayload.left_currency}_${limitOrderPayload.right_currency}`;

  // For dynamic limit orders, wait for liquidity to appear in feed
  if (isDynamicLimit) {
    console.log(
      `Waiting for ${limitOrderPayload.direction} liquidity to appear in feed for ${symbol}...`,
    );

    // Wait for ASK liquidity (since we created a sell order)
    await waitForOrderInFeed(symbol, limitOrderPayload.direction, 20000, 500);

    console.log(
      `Confirmed ${limitOrderPayload.direction} liquidity available in feed for ${symbol}`,
    );

    // Small additional delay to ensure order book stability
    console.log("Waiting additional 300ms for order book stability...");
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Create market order payload
  const marketOrderPayload: any = {
    constraint: "IOC",
    left_currency: limitOrderPayload.left_currency,
    right_currency: limitOrderPayload.right_currency,
    quantity: limitOrderPayload.quantity,
    direction: oppositeDirection,
    order_type: "MARKET",
  };

  console.log("Opposite Market IOC Order Payload:");
  console.log(JSON.stringify(marketOrderPayload, null, 2));

  // Validate the payload before sending
  if (!marketOrderPayload.left_currency || !marketOrderPayload.right_currency) {
    throw new Error("Missing currency information in market order payload");
  }

  if (!marketOrderPayload.quantity || marketOrderPayload.quantity <= 0) {
    throw new Error(`Invalid quantity: ${marketOrderPayload.quantity}`);
  }

  // Create the opposite order
  const { response, body } = await postOrder(
    "/api/v1/orders/create",
    marketOrderPayload,
    token,
  );

  console.log("Market order response status:", response.status());
  console.log("Market order response body:", JSON.stringify(body, null, 2));

  if (response.status() !== 200) {
    console.error(
      "Market order creation failed with status:",
      response.status(),
    );

    let errorMessage = `Market order creation failed with status: ${response.status()}`;
    if (body && body.message) {
      errorMessage += ` - ${body.message}`;
    }
    if (body && body.errors) {
      errorMessage += ` - Errors: ${JSON.stringify(body.errors)}`;
    }

    throw new Error(errorMessage);
  }

  if (!body.ouid) {
    console.error("Market order response does not contain ouid");
    throw new Error("Market order response does not contain ouid");
  }

  const marketOrderOuid = body.ouid;
  console.log(
    `Opposite Market IOC ${oppositeDirection} order created with OUID: ${marketOrderOuid}`,
  );
  return marketOrderOuid;
}
