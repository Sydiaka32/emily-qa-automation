import { waitForOrderInList } from "./waitForOrderInList";

export async function waitForFOKOrderExecution(
  ouid: string,
  token: string,
  timeout: number = 10000,
  pollInterval: number = 500,
): Promise<{ order: any }> {
  const startTime = Date.now();
  let attempt = 1;

  while (Date.now() - startTime < timeout) {
    console.log(`Checking FOK order ${ouid} status - Attempt ${attempt}`);

    const { body: orderBody } = await waitForOrderInList(ouid, token);
    const order = orderBody.content[0];

    console.log(
      `FOK order status: ${order.status}, Executed: ${order.executed_quantity}/${order.quantity}`,
    );

    // FOK orders should either be FILLED completely or remain NEW (if no liquidity)
    if (order.status === "FILLED") {
      console.log(`FOK order ${ouid} successfully filled`);
      return { order };
    }

    // If FOK order is still NEW but we have some execution, wait a bit more
    if (order.status === "NEW" && order.executed_quantity > 0) {
      console.log(
        `FOK order partially executed: ${order.executed_quantity}/${order.quantity}`,
      );
    }

    // If FOK order is CANCELLED or REJECTED, it failed
    if (order.status === "CANCELLED" || order.status === "REJECTED") {
      throw new Error(
        `FOK order ${ouid} was ${order.status}. Reason: ${order.reason || "No liquidity available"}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    attempt++;
  }

  throw new Error(
    `FOK order ${ouid} did not execute within ${timeout}ms. Final status: NEW`,
  );
}
