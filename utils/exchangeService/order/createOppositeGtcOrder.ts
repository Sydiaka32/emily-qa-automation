import { waitForOrderInList } from "./waitForOrderInList";
import { waitForOrderToBeActive } from "./waitOrderToBeActive";
import { postOrder } from "@utils/apiUtils";
import { generatePrice } from "../../../data/generators";

export async function createOppositeGTCOrder(
  mainOrderPayload: any,
  token: string,
  exchangeRate?: number,
): Promise<string> {
  console.log("Creating opposite GTC order for IOC test precondition...");

  // Determine opposite direction
  const oppositeDirection =
    mainOrderPayload.direction === "BID" ? "ASK" : "BID";

  let price;

  if (exchangeRate) {
    // For SAR/BTC pair, we need to use the inverse of the exchange rate
    // If 1 BTC = X SAR, then 1 SAR = 1/X BTC
    const calculatedPrice = 1 / exchangeRate;

    // Since we can only use 5 decimal places, use a reasonable testing price
    // 0.00001 means 1 SAR = 0.00001 BTC, or 1 BTC = 100,000 SAR
    // This is in the right ballpark for testing
    price = 0.00001;

    console.log(
      `Using exchange rate ${exchangeRate}: calculated 1 SAR = ${calculatedPrice} BTC, using testing price: ${price} BTC`,
    );
  } else {
    // Fallback to existing logic if no exchange rate provided
    price =
      mainOrderPayload.price && mainOrderPayload.price > 0
        ? mainOrderPayload.price
        : generatePrice();
  }

  // Use the same quantity (which is in SAR)
  const oppositeOrderPayload = {
    constraint: "GTC",
    left_currency: mainOrderPayload.left_currency,
    right_currency: mainOrderPayload.right_currency,
    quantity: mainOrderPayload.quantity, // This is in SAR
    direction: oppositeDirection,
    price: price,
    order_type: "LIMIT",
  };

  console.log("Opposite GTC Order Payload:");
  console.log(JSON.stringify(oppositeOrderPayload, null, 2));

  // Create the opposite order
  const { response, body } = await postOrder(
    "/api/v1/orders/create",
    oppositeOrderPayload,
    token,
  );

  // Add response logging for debugging
  console.log("Limit order response status:", response.status());
  console.log("Limit order response body:", JSON.stringify(body, null, 2));

  if (response.status() !== 200) {
    console.error(
      "Limit order creation failed with status:",
      response.status(),
    );
    throw new Error(
      `Limit order creation failed with status: ${response.status()}`,
    );
  }

  if (!body.ouid) {
    console.error("Limit order response does not contain ouid");
    throw new Error("Limit order response does not contain ouid");
  }

  const oppositeOrderOuid = body.ouid;

  // Wait for the opposite order to be active in the order book
  console.log(
    `Waiting for precondition order ${oppositeOrderOuid} to be active...`,
  );
  await waitForOrderInList(oppositeOrderOuid, token);

  // Wait for order to be fully active
  const { order: activeOrder } = await waitForOrderToBeActive(
    oppositeOrderOuid,
    token,
  );
  console.log(
    `Precondition order is active with status: ${activeOrder.status}`,
  );

  // Wait for order book synchronization
  console.log("Waiting 1 second for order book to synchronize...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(
    `Opposite GTC ${oppositeDirection} order created and active with OUID: ${oppositeOrderOuid}`,
  );
  return oppositeOrderOuid;
}
