import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getClearingTransactions } from "@utils/clearingService/transactions/getClearingTransaction";

test.describe("GET /api/v1/ledger/transactions", () => {
  let authToken: string;

  test.beforeAll(async () => {
    // Get authentication token before running tests
    authToken = await getAccessToken(config.memberName, config.password);
  });

  test("should get transactions successfully with 200 status", async () => {
    // Act
    const transactionsResponse = await getClearingTransactions(authToken);

    // Assert
    expect(transactionsResponse).toBeDefined();
    expect(transactionsResponse.content).toBeDefined();
    expect(Array.isArray(transactionsResponse.content)).toBe(true);

    // Skip if no transactions
    if (transactionsResponse.content.length === 0) {
      console.log("No transactions found in response");
      return;
    }

    const transaction = transactionsResponse.content[0];

    // Assert - Check transaction structure
    expect(transaction).toHaveProperty("reference_id");
    expect(transaction).toHaveProperty("type");
    expect(transaction).toHaveProperty("status");
    expect(transaction).toHaveProperty("debtor");
    expect(transaction).toHaveProperty("creditor");
    expect(transaction).toHaveProperty("amount");
    expect(transaction).toHaveProperty("currency");
    expect(transaction).toHaveProperty("note");
    expect(transaction).toHaveProperty("created_at");
    expect(transaction).toHaveProperty("updated_at");
    expect(transaction).toHaveProperty("completed_at");
    expect(transaction).toHaveProperty("settled_at");
    expect(transaction).toHaveProperty("settlement_type");

    // Check nested debtor/creditor structure
    expect(transaction.debtor).toHaveProperty("xmi");
    expect(transaction.debtor).toHaveProperty("name");
    expect(transaction.creditor).toHaveProperty("xmi");
    expect(transaction.creditor).toHaveProperty("name");
  });
});
