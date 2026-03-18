import { expect } from "@playwright/test";

/**
 * Verifies order exists in list and has correct details
 */
export function verifyOrderInList(
  orderBody: any,
  createdOrderOuid: string,
  orderPayload: any,
): any {
  expect(orderBody).toHaveProperty("content");
  expect(Array.isArray(orderBody.content)).toBe(true);

  // Since we are searching by OUID, we expect exactly one order in the content
  expect(orderBody.content.length).toBe(1);

  const foundOrder = orderBody.content[0];
  expect(foundOrder.ouid).toBe(createdOrderOuid);

  // Verify order details
  expect(foundOrder.direction).toBe(orderPayload.direction);
  expect(foundOrder.constraint).toBe(orderPayload.constraint);
  expect(foundOrder.type).toBe(orderPayload.order_type);
  expect(foundOrder.quantity).toBe(orderPayload.quantity);
  //expect(foundOrder.price).toBe(orderPayload.price);
  expect(foundOrder.symbol).toBe(
    `${orderPayload.left_currency}_${orderPayload.right_currency}`,
  );

  console.log(`Order found by OUID: ${foundOrder.ouid}`);
  console.log(`Order status: ${foundOrder.status}`);

  return foundOrder;
}
