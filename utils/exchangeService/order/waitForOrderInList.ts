import { getOrderByOuid } from "@utils/apiUtils";

export async function waitForOrderInList(
  ouid: string,
  token: string,
  maxAttempts: number = 30,
  delayMs: number = 500,
) {
  console.log(`Waiting for order ${ouid} to appear in list...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { response, body } = await getOrderByOuid(ouid, token);

      if (
        response.status() === 200 &&
        body.content &&
        Array.isArray(body.content) &&
        body.content.length > 0
      ) {
        console.log(`Order found in list on attempt ${attempt}/${maxAttempts}`);
        return { response, body };
      }

      console.log(
        `   Attempt ${attempt}/${maxAttempts} - Order not found yet...`,
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
    `Order ${ouid} not found in list after ${maxAttempts} attempts`,
  );
}
