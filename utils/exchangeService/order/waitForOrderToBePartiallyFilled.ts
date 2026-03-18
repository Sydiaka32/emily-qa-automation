import { getOrderByOuid } from "@utils/apiUtils";
import { OrderStatuses } from "../../../consts/exchange/orderStatuses";

/**
 * Waits for an order to reach PARTIALLY_FILLED status
 */
export async function waitForOrderToBePartiallyFilled(
  ouid: string,
  token: string,
  maxAttempts: number = 30,
  delayMs: number = 400,
) {
  console.log(`Waiting for order ${ouid} to reach PARTIALLY_FILLED status...`);

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
          `Attempt ${attempt}/${maxAttempts}: Order status is ${order.status}, executed: ${order.executed_quantity}/${order.quantity}`,
        );

        if (order.status === OrderStatuses.partiallyFilled) {
          console.log(`Order ${ouid} is PARTIALLY_FILLED`);
          return { response, body, order };
        }
      }

      console.log(
        `   Attempt ${attempt}/${maxAttempts} - Order not partially filled yet...`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.log(`   Attempt ${attempt}/${maxAttempts} - Error: ${message}`);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    `Order ${ouid} did not reach PARTIALLY_FILLED status after ${maxAttempts} attempts`,
  );
}
