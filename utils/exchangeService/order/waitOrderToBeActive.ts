import { getOrderByOuid } from "@utils/apiUtils";
import { OrderStatuses } from "../../../consts/exchange/orderStatuses";

/**
 * Waits for an order to reach NEW status (active in order book)
 */
export async function waitForOrderToBeActive(
  ouid: string,
  token: string,
  maxAttempts: number = 25,
  delayMs: number = 500,
) {
  console.log(`Waiting for order ${ouid} to reach NEW status...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { response, body } = await getOrderByOuid(ouid, token);

      if (
        response.status() === 200 &&
        body.content &&
        Array.isArray(body.content) &&
        body.content.length > 0
      ) {
        const order = body.content[0];
        console.log(
          `Attempt ${attempt}/${maxAttempts}: Order status is ${order.status}`,
        );

        if (order.status === OrderStatuses.open) {
          console.log(
            `Order ${ouid} is active in order book with status: ${order.status}`,
          );
          return { response, body, order };
        }
      }

      console.log(
        `   Attempt ${attempt}/${maxAttempts} - Order not active yet...`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.log(`   Attempt ${attempt}/${maxAttempts} - Error: ${message}`);
    }

    // Wait before next attempt (except on last attempt)
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    `Order ${ouid} did not reach active status after ${maxAttempts} attempts`,
  );
}
