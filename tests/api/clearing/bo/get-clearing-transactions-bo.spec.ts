import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { getClearingTransactionsBo } from "@utils/clearingService/transactions/bo/getClearingTransactionsBo";
import { verifyClearingTransactionsBo } from "@utils/clearingService/transactions/bo/verifyClearingTransactionsBo";

test.describe("BackOffice - GET /api/v1/ledger-admin/transactions", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get operator token for BO operations
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");
  });

  test("BO: Should get clearing transactions successfully with 200 status", async () => {
    console.log("=== Testing BO clearing transactions retrieval ===");

    // Act - Get transactions via BO
    console.log("Fetching clearing transactions via Back Office...");
    const transactionsResponse = await getClearingTransactionsBo(operatorToken);

    // Assert - Response structure
    console.log("\n=== Response Structure Validation ===");
    expect(transactionsResponse).toBeDefined();
    expect(transactionsResponse.content).toBeDefined();
    expect(Array.isArray(transactionsResponse.content)).toBe(true);

    // Check pagination fields
    expect(transactionsResponse.total_pages).toBeDefined();
    expect(typeof transactionsResponse.total_pages).toBe("number");
    expect(transactionsResponse.total_elements).toBeDefined();
    expect(typeof transactionsResponse.total_elements).toBe("number");
    expect(transactionsResponse.number).toBeDefined();
    expect(typeof transactionsResponse.number).toBe("number");
    expect(transactionsResponse.size).toBeDefined();
    expect(typeof transactionsResponse.size).toBe("number");
    expect(transactionsResponse.first).toBeDefined();
    expect(typeof transactionsResponse.first).toBe("boolean");
    expect(transactionsResponse.last).toBeDefined();
    expect(typeof transactionsResponse.last).toBe("boolean");

    console.log(`Total pages: ${transactionsResponse.total_pages}`);
    console.log(`Total elements: ${transactionsResponse.total_elements}`);
    console.log(`Current page: ${transactionsResponse.number}`);
    console.log(`Page size: ${transactionsResponse.size}`);
    console.log(`Is first page: ${transactionsResponse.first}`);
    console.log(`Is last page: ${transactionsResponse.last}`);
    console.log(
      `Transactions in response: ${transactionsResponse.content.length}`,
    );

    // Skip if no transactions
    if (transactionsResponse.content.length === 0) {
      console.log("No transactions found in BO response");
      return;
    }

    // Verify transaction structure
    verifyClearingTransactionsBo(transactionsResponse.content);

    console.log("\nBO clearing transactions test completed successfully");
  });
});
