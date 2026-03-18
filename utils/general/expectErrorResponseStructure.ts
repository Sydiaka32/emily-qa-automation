import { expect } from "@playwright/test";

export const expectErrorResponseStructure = (body: any) => {
  expect(body).toHaveProperty("code");
  expect(body).toHaveProperty("message");
};