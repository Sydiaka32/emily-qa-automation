import { getOrderByOuid } from "@utils/apiUtils";

/**
 * Waits for an order to reach a specific executed quantity with floating-point tolerance
 */
export async function waitForOrderExecutedQuantity(
  ouid: string,
  token: string,
  expectedExecutedQuantity: number,
  maxAttempts: number = 25,
  delayMs: number = 500,
  precision: number = 2, // New parameter for decimal precision
) {
  console.log(
    `Waiting for order ${ouid} to reach executed quantity: ${expectedExecutedQuantity}...`,
  );

  // Helper function to compare quantities with tolerance
  const areQuantitiesEqual = (actual: number, expected: number): boolean => {
    const tolerance = Math.pow(10, -precision);
    return Math.abs(actual - expected) < tolerance;
  };

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
        const currentExecuted = parseFloat(order.executed_quantity);
        const expected = parseFloat(expectedExecutedQuantity as any);

        console.log(
          `Attempt ${attempt}/${maxAttempts}: Order executed quantity is ${currentExecuted}, expected ${expected}`,
        );

        // Use tolerant comparison instead of exact match
        if (areQuantitiesEqual(currentExecuted, expected)) {
          console.log(`Order ${ouid} reached expected executed quantity`);
          return { response, body, order };
        }

        // Optional: Also check if it's greater than expected (as fallback)
        if (currentExecuted > expected) {
          console.log(
            `Order ${ouid} exceeded expected executed quantity (${currentExecuted} > ${expected})`,
          );
          return { response, body, order };
        }
      }

      console.log(
        `   Attempt ${attempt}/${maxAttempts} - Executed quantity not yet reached...`,
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
    `Order ${ouid} did not reach expected executed quantity ${expectedExecutedQuantity} after ${maxAttempts} attempts`,
  );
}
