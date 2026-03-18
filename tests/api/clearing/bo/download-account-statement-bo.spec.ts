import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { downloadAndVerifyAccountStatementBo } from "@utils/clearingService/positions/bo/downloadAndVerifyAccountStatementBo";
import { verifyAccountStatementContentBo } from "@utils/clearingService/positions/bo/verifyAccountStatementContentBo";
import { getYesterdayDate } from "../../../../data/getYesterdayDate";
import { getDateNDaysAgo } from "../../../../data/getDateNDaysAgo";
import { findMemberWithPositions } from "@utils/clearingService/positions/bo/findMemberWithPositions";

test.describe("BackOffice - Account Statement - Download", () => {
  let operatorToken: string;
  let testXmi: string = "";
  let testMemberName: string = "";

  test.beforeAll(async () => {
    // Get operator token for BO operations
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Find a member with positions (we'll use this member for testing)
    console.log("\nFinding a member for account statement testing...");
    const result = await findMemberWithPositions(operatorToken);
    testXmi = result.xmi;
    testMemberName = result.name;
    console.log(`Selected member: ${testXmi} (${testMemberName})`);
  });

  test("BO: Download account statement for a member for yesterday", async ({
    page,
  }) => {
    console.log("=== Testing BO account statement download for yesterday ===");
    console.log(`Member: ${testXmi} (${testMemberName})`);

    // Use yesterday's date
    const yesterday = getYesterdayDate();
    const fromDate = yesterday;
    const toDate = yesterday;

    console.log(`Date range: ${fromDate} to ${toDate}`);
    console.log(`Date format: YYYY-MM-DD (${fromDate.length === 10})`);

    // Intercept the request to log the URL
    let requestUrl = "";
    page.on("request", (request) => {
      if (request.url().includes("account-statement-reports")) {
        requestUrl = request.url();
      }
    });

    // Download account statement via BO
    const statementResult = await downloadAndVerifyAccountStatementBo(
      operatorToken,
      testXmi,
      fromDate,
      toDate,
    );

    // Log the actual request URL
    if (requestUrl) {
      console.log(`\nActual BO request URL:`);
      console.log(requestUrl);

      // Extract and log query parameters
      try {
        const urlObj = new URL(requestUrl);
        const memberParam = urlObj.searchParams.get("member_xmi");
        const fromParam = urlObj.searchParams.get("from");
        const toParam = urlObj.searchParams.get("to");
        console.log(`Query params in URL:`);
        console.log(`  member_xmi=${memberParam}`);
        console.log(`  from=${fromParam}`);
        console.log(`  to=${toParam}`);
      } catch (error) {
        console.log(`Could not parse URL: ${error}`);
      }
    }

    // Verify response
    expect(statementResult.response.status()).toBe(200);
    expect(statementResult.fileSize).toBeGreaterThan(0);

    console.log(
      `Response: Status ${statementResult.response.status()}, Size: ${statementResult.fileSize} bytes`,
    );

    // Verify content
    verifyAccountStatementContentBo(
      statementResult.content,
      fromDate,
      toDate,
      testXmi,
    );

    // Verify response headers
    const contentType = statementResult.response.headers()["content-type"];
    expect(contentType).toContain("text/csv");
    console.log(`Content-Type: ${contentType}`);

    const contentDisposition =
      statementResult.response.headers()["content-disposition"];
    if (contentDisposition) {
      expect(contentDisposition).toContain("attachment");
      expect(contentDisposition).toContain(".csv");
      console.log(`Content-Disposition: ${contentDisposition}`);
    }

    console.log("\nBO account statement download test completed successfully");
  });

  test("BO: Download account statement for a member for last 7 days", async ({
    page,
  }) => {
    console.log(
      "\n=== Testing BO account statement download for last 7 days ===",
    );
    console.log(`Member: ${testXmi} (${testMemberName})`);

    const toDate = getYesterdayDate();
    const fromDate = getDateNDaysAgo(7);

    console.log(`Date range: ${fromDate} to ${toDate}`);
    console.log(
      `Format check: ${/^\d{4}-\d{2}-\d{2}$/.test(fromDate) ? "YYYY-MM-DD" : "Wrong format"}`,
    );

    // Intercept the request to log the URL
    let requestUrl = "";
    page.on("request", (request) => {
      if (request.url().includes("account-statement-reports")) {
        requestUrl = request.url();
      }
    });

    const statementResult = await downloadAndVerifyAccountStatementBo(
      operatorToken,
      testXmi,
      fromDate,
      toDate,
    );

    // Log the actual request URL
    if (requestUrl) {
      console.log(`\nActual BO request URL:`);
      console.log(requestUrl);
    }

    expect(statementResult.response.status()).toBe(200);
    expect(statementResult.fileSize).toBeGreaterThan(0);

    console.log(
      `Response: Status ${statementResult.response.status()}, Size: ${statementResult.fileSize} bytes`,
    );

    // Verify content
    verifyAccountStatementContentBo(
      statementResult.content,
      fromDate,
      toDate,
      testXmi,
    );

    console.log(
      "\nBO 7-day account statement download test completed successfully",
    );
  });

  test("BO: Download account statement with invalid member XMI should fail", async () => {
    console.log(
      "\n=== Testing BO account statement with invalid member XMI ===",
    );

    const invalidXmi = "INVALID_XMI_123";
    const yesterday = getYesterdayDate();

    console.log(`Using invalid XMI: ${invalidXmi}`);
    console.log(`Date: ${yesterday}`);

    try {
      await downloadAndVerifyAccountStatementBo(
        operatorToken,
        invalidXmi,
        yesterday,
        yesterday,
      );

      new Error("Expected download to fail with invalid member XMI");
    } catch (error: any) {
      console.log(`Expected error occurred: ${error.message}`);
    }
  });

  test("BO: Download account statement with invalid date range should fail", async () => {
    console.log(
      "\n=== Testing BO account statement with invalid date range ===",
    );

    const futureDate = "2100-01-01";
    console.log(`Using future date: "${futureDate}"`);

    try {
      await downloadAndVerifyAccountStatementBo(
        operatorToken,
        testXmi,
        futureDate,
        futureDate,
      );

      new Error("Expected download to fail with future date");
    } catch (error: any) {
      console.log(`Expected error occurred: ${error.message}`);
    }
  });
});
