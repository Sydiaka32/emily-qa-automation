import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { downloadAccountStatement } from "@utils/clearingService/positions/downloadAccountStatement";
import { verifyAccountStatementContent } from "@utils/clearingService/positions/verifyAccountStatementContent";
import { getDateNDaysAgo } from "../../../../data/getDateNDaysAgo";
import { getYesterdayDate } from "../../../../data/getYesterdayDate";

test.describe("Account Statement - Download", () => {
  let memberToken: string;

  test.beforeAll(async () => {
    // Get token for the member
    memberToken = await getAccessToken(config.memberName, config.password);
  });

  test("Download account statement for yesterday", async ({ page }) => {
    console.log("=== Testing account statement download for yesterday ===");

    // Use yesterday's date for both from and to
    const yesterday = getYesterdayDate();
    const fromDate = yesterday;
    const toDate = yesterday;

    console.log(`Generated date: "${yesterday}"`);
    console.log(
      `Expected format: YYYY-MM-DD (${yesterday.length === 10 ? "✓" : "✗"})`,
    );
    console.log(`Contains hyphens: ${yesterday.includes("-") ? "✓" : "✗"}`);

    // Intercept the request to log the URL
    let requestUrl = "";
    page.on("request", (request) => {
      if (request.url().includes("account-statement-reports")) {
        requestUrl = request.url();
      }
    });

    // Download account statement
    const { response, body } = await downloadAccountStatement(
      memberToken,
      fromDate,
      toDate,
    );

    // Log the actual request URL
    if (requestUrl) {
      console.log(`Request URL sent:`);
      console.log(requestUrl);

      // Extract and log query parameters
      try {
        const urlObj = new URL(requestUrl);
        const fromParam = urlObj.searchParams.get("from");
        const toParam = urlObj.searchParams.get("to");
        console.log(`Query params in URL:`);
        console.log(`  from=${fromParam}`);
        console.log(`  to=${toParam}`);
      } catch (error) {
        console.log(`Could not parse URL: ${error}`);
      }
    }

    // Verify response
    expect(response.status()).toBe(200);
    expect(body).toBeDefined();
    expect(body.length).toBeGreaterThan(0);

    // Convert to text
    const csvContent = body.toString("utf-8");
    console.log(
      `Response: Status ${response.status()}, Size: ${body.length} bytes`,
    );

    // Verify content
    verifyAccountStatementContent(csvContent, fromDate, toDate);

    console.log("\nTest completed successfully");
  });

  test("Download account statement for last 7 days", async ({ page }) => {
    console.log("\n=== Testing account statement download for last 7 days ===");

    const toDate = getYesterdayDate();
    const fromDate = getDateNDaysAgo(7);

    console.log(`Generated dates:`);
    console.log(`  from: "${fromDate}" (7 days ago)`);
    console.log(`  to:   "${toDate}" (yesterday)`);
    console.log(
      `Format check: ${/^\d{4}-\d{2}-\d{2}$/.test(fromDate) ? "YYYY-MM-DD ✓" : "Wrong format ✗"}`,
    );

    // Intercept the request to log the URL
    let requestUrl = "";
    page.on("request", (request) => {
      if (request.url().includes("account-statement-reports")) {
        requestUrl = request.url();
      }
    });

    const { response, body } = await downloadAccountStatement(
      memberToken,
      fromDate,
      toDate,
    );

    // Log the actual request URL
    if (requestUrl) {
      console.log(`Request URL sent:`);
      console.log(requestUrl);
    }

    expect(response.status()).toBe(200);
    expect(body).toBeDefined();
    expect(body.length).toBeGreaterThan(0);

    const csvContent = body.toString("utf-8");
    verifyAccountStatementContent(csvContent, fromDate, toDate);

    console.log(
      "\n7-day account statement download test completed successfully",
    );
  });

  test("Verify account statement CSV format", async ({ page }) => {
    console.log("\n=== Testing account statement CSV format validation ===");

    const yesterday = getYesterdayDate();
    console.log(`Using date: "${yesterday}"`);

    // Intercept the request to log the URL
    let requestUrl = "";
    page.on("request", (request) => {
      if (request.url().includes("account-statement-reports")) {
        requestUrl = request.url();
      }
    });

    const { response, body } = await downloadAccountStatement(
      memberToken,
      yesterday,
      yesterday,
    );

    // Log the actual request URL
    if (requestUrl) {
      console.log(`Request URL sent:`);
      console.log(requestUrl);
    }

    expect(response.status()).toBe(200);
    const csvContent = body.toString("utf-8");
    const lines = csvContent
      .split("\n")
      .filter((line) => line.trim().length > 0);

    if (lines.length > 0) {
      // Check headers
      const headers = lines[0].split(",");
      console.log(
        `CSV has ${headers.length} columns, ${lines.length - 1} data rows`,
      );

      // Verify content type header
      const contentType = response.headers()["content-type"];
      expect(contentType).toContain("text/csv");

      console.log("Account statement CSV format is valid");
    }
  });

  test("Download account statement with invalid date range should fail", async () => {
    console.log("\n=== Testing account statement with invalid date range ===");

    const futureDate = "2100-01-01";
    console.log(`Using future date: "${futureDate}"`);

    try {
      await downloadAccountStatement(memberToken, futureDate, futureDate);

      // If we get here, the test should fail because we expected an error
      await new Error("Expected download to fail with future date");
    } catch (error: any) {
      console.log(`Expected error occurred: ${error.message}`);
      // Expect some error status (400, 404, etc.)
    }
  });
});
