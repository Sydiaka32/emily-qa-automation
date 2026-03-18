import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { getCreditTransfers } from "@utils/creditTransferService/creditTransfer/getCreditTransfers";
import { config } from "../../../../test.config";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { CreditTransferTypes } from "../../../../consts/credit-transfer/creditTransferTypes";

test.describe("Credit Transfer - CT history", () => {
  let memberToken: string;

  test.beforeAll(async () => {
    // Get token for the member
    memberToken = await getAccessToken(config.memberName, config.password);
  });

  test("Get list of transactions with default pagination", async () => {
    console.log("Testing credit transfers list with default pagination...");

    // Get transactions list with default parameters (page=0, size=10)
    const { body } = await getCreditTransfers(memberToken);

    // Verify response structure
    console.log("Verifying response structure...");
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
    console.log(`Has next: ${body.has_next}`);
    console.log(`Has previous: ${body.has_previous}`);
    console.log(`Number of transactions in response: ${body.content.length}`);

    // Verify pagination properties
    expect(body.number).toBe(0); // Should be first page (0-indexed)
    expect(body.size).toBe(10); // Default size
    expect(body.first).toBe(true); // Should be first page
    expect(body.size).toBeGreaterThan(0);
    expect(body.total_pages).toBeGreaterThan(0);
    expect(body.total_elements).toBeGreaterThan(0);

    // If there are transactions, verify their structure
    if (body.content.length > 0) {
      console.log("Verifying transaction structure...");
      const transaction = body.content[0];

      // Verify required fields in transaction
      expect(transaction).toHaveProperty("reference_id");
      expect(transaction).toHaveProperty("type");
      expect(transaction).toHaveProperty("status");
      expect(transaction).toHaveProperty("debtor");
      expect(transaction).toHaveProperty("creditor");
      expect(transaction).toHaveProperty("amount");
      expect(transaction).toHaveProperty("currency");
      expect(transaction).toHaveProperty("created_at");
      expect(transaction).toHaveProperty("updated_at");
      expect(transaction).toHaveProperty("settlement_type");

      // Verify debtor structure
      expect(transaction.debtor).toHaveProperty("xmi");
      expect(transaction.debtor).toHaveProperty("name");

      // Verify creditor structure
      expect(transaction.creditor).toHaveProperty("xmi");
      expect(transaction.creditor).toHaveProperty("name");

      // Verify valid types and statuses
      const validTypes = Object.values(CreditTransferTypes);
      const validStatuses = Object.values(CreditTransferStatuses);

      expect(validTypes).toContain(transaction.type);
      expect(validStatuses).toContain(transaction.status);

      console.log(
        `First transaction: ${transaction.reference_id} (${transaction.type} - ${transaction.status})`,
      );
    }

    console.log("Credit transfers list test completed successfully");
  });

  test("Get list of transactions with custom pagination", async () => {
    console.log("Testing credit transfers list with custom pagination...");

    const page = 1;
    const size = 5;

    // Get transactions list with custom pagination
    const { body } = await getCreditTransfers(
      memberToken,
      undefined,
      page,
      size,
    );

    // Verify response structure
    expect(body).toHaveProperty("number");
    expect(body).toHaveProperty("size");
    expect(body.number).toBe(page);
    expect(body.size).toBe(size);
    expect(body.content.length).toBeLessThanOrEqual(size);

    console.log(`Custom pagination - Page: ${body.number}, Size: ${body.size}`);
    console.log(`Transactions count: ${body.content.length}`);

    // Verify pagination flags
    if (body.total_pages > 1) {
      expect(body.has_previous).toBe(true); // Page 1 should have previous
    }

    if (page < body.total_pages - 1) {
      expect(body.has_next).toBe(true); // Should have next if not last page
    }

    console.log("✓ Custom pagination test completed successfully");
  });

  test("Get list of transactions with search filter", async () => {
    console.log("Testing credit transfers list with search filter...");

    // Search for a specific reference ID (use a known pattern or let's search for credit returns)
    const searchTerm = "XRET"; // Search for credit returns
    const { body } = await getCreditTransfers(memberToken, searchTerm);

    // Verify response structure
    expect(body).toHaveProperty("content");
    expect(Array.isArray(body.content)).toBe(true);

    console.log(`Search term: ${searchTerm}`);
    console.log(`Found ${body.content.length} transactions matching search`);

    // If we found transactions, verify they match the search criteria
    if (body.content.length > 0) {
      body.content.forEach((transaction: any) => {
        // The search might match reference_id, type, or other fields
        // Based on the example, XRET is the prefix for credit returns
        expect(transaction.type).toBe(CreditTransferTypes.creditReturn);
      });

      console.log(`All ${body.content.length} transactions are credit returns`);
    }

    console.log("Search filter test completed successfully");
  });
});
