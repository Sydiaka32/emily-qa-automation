import { getOrderByOuid } from "@utils/apiUtils";
import { OrderStatuses } from "../../../consts/exchange/orderStatuses";

/**
 * Waits for an order to reach PARTIALLY_CANCELED status
 */
export async function waitForOrderToBePartiallyCanceled(
  ouid: string,
  token: string,
  maxAttempts: number = 30,
  delayMs: number = 500,
) {
  console.log(
    `Waiting for order ${ouid} to reach PARTIALLY_CANCELED status...`,
  );

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

        // FIXED: Check for both PARTIALLY_CANCELED and also handle CANCELED with partial execution
        if (
          order.status === OrderStatuses.partiallyCancelled ||
          order.status === "PARTIALLY_CANCELED"
        ) {
          console.log(`Order ${ouid} is PARTIALLY_CANCELED`);
          return { response, body, order };
        }

        // ADDED: Also handle the case where order is CANCELED but has partial execution
        if (
          (order.status === OrderStatuses.cancelled ||
            order.status === "CANCELED") &&
          order.executed_quantity > 0
        ) {
          console.log(
            `Order ${ouid} is CANCELED but has partial execution (${order.executed_quantity}/${order.quantity}) - this is effectively PARTIALLY_CANCELED behavior`,
          );
          return { response, body, order };
        }

        // ADDED: Also handle PARTIALLY_FILLED status which might be an intermediate state
        if (order.status === "PARTIALLY_FILLED") {
          console.log(
            `Order ${ouid} is PARTIALLY_FILLED, waiting for final state...`,
          );
          // Continue waiting for final state
        }
      }

      console.log(
        `   Attempt ${attempt}/${maxAttempts} - Order not partially canceled yet...`,
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
    `Order ${ouid} did not reach PARTIALLY_CANCELED status after ${maxAttempts} attempts`,
  );
}
