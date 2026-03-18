import { expect } from "@playwright/test";

/**
 * Verify account statement CSV content
 */
export function verifyAccountStatementContent(
  csvContent: string,
  fromDate: string,
  toDate: string,
): void {
  console.log("Verifying account statement CSV content...");

  // Split into lines
  const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);

  // Check if we have at least a header row
  expect(lines.length).toBeGreaterThan(0);

  // Verify headers
  const headers = lines[0].split(",");
  const expectedHeaders = [
    "Date",
    "Type",
    "Amount",
    "Balance",
    "Currency",
    "ClrSysRef",
    "Description",
    "Exchange From",
    "Exchange To",
    "Exchange Rate",
    "Exchange To Amount",
  ];

  // Verify all expected headers are present
  expectedHeaders.forEach((header) => {
    expect(headers).toContain(header);
  });

  console.log(`✓ All ${expectedHeaders.length} expected headers found`);

  // If there are data rows, verify their structure
  if (lines.length > 1) {
    console.log(`Found ${lines.length - 1} transaction records`);

    // Verify each data row
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const columns = row.split(",");

      // Should have same number of columns as headers
      expect(columns.length).toBe(headers.length);

      // Verify date format (YYYY-MM-DD)
      const date = columns[headers.indexOf("Date")];
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify date is within the requested range
      const transactionDate = new Date(date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      expect(transactionDate >= from).toBe(true);
      expect(transactionDate <= to).toBe(true);

      // Verify amount is a valid number (can be positive or negative)
      const amount = columns[headers.indexOf("Amount")];
      expect(isNaN(parseFloat(amount))).toBe(false);

      // Verify balance is a valid number
      const balance = columns[headers.indexOf("Balance")];
      expect(isNaN(parseFloat(balance))).toBe(false);

      // Verify currency is 3 characters
      const currency = columns[headers.indexOf("Currency")];
      expect(currency.length).toBe(3);

      // Log first few transactions for verification
      if (i <= 3) {
        console.log(
          `  Transaction ${i}: ${date} - ${columns[headers.indexOf("Type")]} - ${amount} ${currency}`,
        );
      }
    }
  } else {
    console.log("No transaction records found in the statement");
  }
}
