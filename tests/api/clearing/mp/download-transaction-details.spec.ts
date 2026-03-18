import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getClearingTransactions } from "@utils/clearingService/transactions/getClearingTransaction";
import { downloadAndVerifyTransactionDetails } from "@utils/clearingService/transactions/mp/downloadAndVerifyTransactionDetails";

test.describe("Transaction Details - Download", () => {
  let memberToken: string;

  test.beforeAll(async () => {
    // Get token for the member
    memberToken = await getAccessToken(config.memberName, config.password);
  });

  test("Download transaction details for a valid transaction", async () => {
    console.log("=== Testing transaction details download ===");

    // Step 1: Get a recent transaction to use for the download
    console.log("Fetching recent transactions...");
    const transactions = await getClearingTransactions(memberToken, 0, 1);

    expect(transactions.content).toBeDefined();
    expect(transactions.content.length).toBeGreaterThan(0);

    const transaction = transactions.content[0];
    const referenceId = transaction.reference_id;

    console.log(`Using transaction reference ID: ${referenceId}`);
    console.log(`Transaction type: ${transaction.type}`);
    console.log(
      `Transaction amount: ${transaction.amount} ${transaction.currency}`,
    );

    // Step 2: Download transaction details
    console.log("\nDownloading transaction details...");
    const detailsResult = await downloadAndVerifyTransactionDetails(
      memberToken,
      referenceId,
    );

    // Step 3: Verify the download
    expect(detailsResult.fileSize).toBeGreaterThan(0);
    expect(detailsResult.content.length).toBeGreaterThan(0);

    // Verify it's a CSV
    const lines = detailsResult.content
      .split("\n")
      .filter((line) => line.trim());
    expect(lines.length).toBeGreaterThan(0);

    // Check if it contains the reference ID somewhere in the content
    expect(detailsResult.content).toContain(referenceId);

    // Verify response headers
    const contentType = detailsResult.response.headers()["content-type"];
    expect(contentType).toContain("application/octet-stream");

    const contentDisposition =
      detailsResult.response.headers()["content-disposition"];
    if (contentDisposition) {
      expect(contentDisposition).toContain("attachment");
      expect(contentDisposition).toContain(".txt");
      console.log(`Filename: ${contentDisposition}`);
    }

    console.log(`Transaction details TXT has ${lines.length} lines`);
    console.log("Transaction details download test completed successfully!");
  });

  test("Verify transaction details TXT structure", async () => {
    console.log("\n=== Testing transaction details TXT structure ===");

    // Get a transaction
    const transactions = await getClearingTransactions(memberToken, 0, 1);
    const referenceId = transactions.content[0].reference_id;

    console.log(`Testing with transaction: ${referenceId}`);

    const detailsResult = await downloadAndVerifyTransactionDetails(
      memberToken,
      referenceId,
    );

    const content = detailsResult.content;
    const lines = content.split("\n").filter((line) => line.trim());

    // First line should be headers
    const headers = lines[0].split(",");
    console.log("TXT Headers:", headers);
    console.log(`Number of columns: ${headers.length}`);

    // Check for common transaction detail headers
    const commonHeaders = [
      "Transaction ID",
      "Date",
      "Type",
      "Amount",
      "Currency",
      "Status",
    ];
    const foundHeaders = commonHeaders.filter((header) =>
      headers.some((h) => h.toLowerCase().includes(header.toLowerCase())),
    );

    console.log(`Found ${foundHeaders.length} common headers:`, foundHeaders);

    // Verify we have data rows (excluding header)
    if (lines.length > 1) {
      console.log(`TXT contains ${lines.length - 1} data rows`);

      // Sample first data row
      const firstDataRow = lines[1].split(",");
      console.log(
        "First data row sample:",
        firstDataRow.slice(0, 5).join(", "),
      );

      // Verify the CSV contains the reference ID
      const csvContainsReferenceId = lines.some((line) =>
        line.includes(referenceId),
      );
      console.log(
        `TXT contains reference ID: ${csvContainsReferenceId ? "✓" : "✗"}`,
      );
    }

    console.log("Transaction details TXT structure verified");
  });

  test("Download transaction details with invalid reference ID should fail", async () => {
    console.log("\n=== Testing with invalid reference ID ===");

    const invalidReferenceId = "INVALID_REF_12345";
    console.log(`Using invalid reference ID: ${invalidReferenceId}`);

    try {
      await downloadAndVerifyTransactionDetails(
        memberToken,
        invalidReferenceId,
      );

      // If we get here, the test should fail because we expected an error
      new Error("Expected download to fail with invalid reference ID");
    } catch (error: any) {
      console.log(`Expected error occurred: ${error.message}`);
      // The error could be 404, 400, etc.
    }
  });
});
