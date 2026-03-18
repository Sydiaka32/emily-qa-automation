import { expect } from "@playwright/test";

/**
 * Verifies the initial order creation response
 */
export function verifyOrderCreationResponse(response: any, body: any): string {
  expect(response.status()).toBe(200);
  expect(body).toHaveProperty("ouid");
  expect(typeof body.ouid).toBe("string");
  expect(body.ouid).toContain("XO");

  const createdOrderOuid = body.ouid;
  console.log(`Order created successfully with OUID: ${body.ouid}`);

  return createdOrderOuid;
}
