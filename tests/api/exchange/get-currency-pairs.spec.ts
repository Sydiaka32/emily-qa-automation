import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../test.config";
import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";

test.describe("Exchange API - Currency Pairs", () => {
  const endpoint = "/api/v1/market/pairs?page=0&size=100";
  const username = config.memberName;
  const password = config.password;

  let token: string;

  test.beforeAll(async () => {
    token = await getAccessToken(username, password);
  });

  test("GET currency pairs should return valid data", async () => {
    const { response, body } = await getRequest(endpoint, token);

    expect(response.status()).toBe(200);
    console.log(`Response body: ${JSON.stringify(body)}`);
    expect(Array.isArray(body.content)).toBe(true);

    if (body.length > 0) {
      const firstPair = body[0];
      expect(firstPair).toHaveProperty("id");
      expect(firstPair).toHaveProperty("base");
      expect(firstPair).toHaveProperty("quote");
      expect(firstPair).toHaveProperty("minOrderAmount");
      expect(firstPair).toHaveProperty("maxOrderAmount");
    }

    body.content.forEach((pair: any) => {
      expect(pair.minOrderAmount).toBeLessThanOrEqual(pair.maxOrderAmount);
    });
  });
});
