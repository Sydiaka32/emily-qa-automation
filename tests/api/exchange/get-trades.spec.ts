import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../test.config";
import { getTrades } from "@utils/apiUtils/market/getTrades";


test.describe("Exchange API - Trades", () => {
  let token: string;

  test.beforeAll(async () => {
    token = await getAccessToken(config.memberName, config.password);
  });

  test("GET trades should return valid data", async () => {
    const { response, body } = await getTrades(0, 10, token);

    expect(response.status()).toBe(200);
    console.log(`Response status: ${response.status()}`);

    // Verify response structure
    expect(body).toHaveProperty("total_pages");
    expect(body).toHaveProperty("total_elements");
    expect(body).toHaveProperty("number");
    expect(body).toHaveProperty("size");
    expect(body).toHaveProperty("first");
    expect(body).toHaveProperty("last");
    expect(body).toHaveProperty("has_next");
    expect(body).toHaveProperty("has_previous");
    expect(body).toHaveProperty("content");
    expect(Array.isArray(body.content)).toBe(true);

    console.log(`Total pages: ${body.total_pages}`);
    console.log(`Total elements: ${body.total_elements}`);
    console.log(`Current page: ${body.number}`);
    console.log(`Page size: ${body.size}`);
    console.log(`Number of trades in response: ${body.content.length}`);

    // Verify pagination metadata
    expect(body.number).toBe(0);
    expect(body.size).toBe(10);
    expect(body.first).toBe(true);
    expect(body.has_previous).toBe(false);

    // If there are trades, verify their structure
    if (body.content.length > 0) {
      const firstTrade = body.content[0];
      console.log(`First trade: ${JSON.stringify(firstTrade, null, 2)}`);

      // Verify required fields
      expect(firstTrade).toHaveProperty("id");
      expect(firstTrade).toHaveProperty("tuid");
      expect(firstTrade).toHaveProperty("symbol");
      expect(firstTrade).toHaveProperty("status");
      expect(firstTrade).toHaveProperty("ouid");
      expect(firstTrade).toHaveProperty("price");
      expect(firstTrade).toHaveProperty("quantity");
      expect(firstTrade).toHaveProperty("quote_quantity");
      expect(firstTrade).toHaveProperty("trade_date");
      expect(firstTrade).toHaveProperty("created_at");
      expect(firstTrade).toHaveProperty("is_maker");
      expect(firstTrade).toHaveProperty("order_direction");

      // Verify field formats
      expect(firstTrade.tuid).toMatch(/^XT\d+$/);
      expect(firstTrade.ouid).toMatch(/^XO\d+$/);
      expect(firstTrade.symbol).toMatch(/^[A-Z]{3}_[A-Z]{3}$/);
      expect(["COMPLETED", "CANCELLED", "PENDING", "FAILED"]).toContain(
        firstTrade.status,
      );
      expect(["BID", "ASK"]).toContain(firstTrade.order_direction);

      // Verify numeric values
      expect(firstTrade.price).toBeGreaterThan(0);
      expect(firstTrade.quantity).toBeGreaterThan(0);
      expect(firstTrade.quote_quantity).toBeGreaterThan(0);

      // Verify date formats
      expect(firstTrade.trade_date).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
      expect(firstTrade.created_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );

      // Verify all trades in the response
      body.content.forEach((trade: any) => {
        expect(trade.price).toBeGreaterThan(0);
        expect(trade.quantity).toBeGreaterThan(0);
        expect(trade.quote_quantity).toBeGreaterThan(0);
      });
    } else {
      console.log("No trades found in response");
    }
  });
});
