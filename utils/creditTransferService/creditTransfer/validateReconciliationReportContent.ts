import { expect } from "@playwright/test";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { ReconciliationReportResult } from "../../../modules/creditTransfer/ReconciliationReportResult";

/**
 * Validates the structure and content of the reconciliation report
 */
export function validateReconciliationReportContent(
  reportResult: ReconciliationReportResult,
  memberXmi: string,
  domesticCurrency: string,
  settlementType: string = SettlementTypes.dns,
): void {
  console.log("Validating reconciliation report content...");

  const {
    lines,
    dataLines,
    foundRecordTypes,
    headerLine,
    trailerLine,
    recordCount,
    textContent,
  } = reportResult;

  // Step 1: Verify basic file structure
  expect(lines.length).toBeGreaterThan(0);
  console.log(`Total lines in report: ${lines.length}`);

  // Step 2: Verify header line (HDRC)
  expect(headerLine).toMatch(/^HDRC/);
  console.log(`Header line: ${headerLine}`);

  // Step 3: Verify header contains expected information
  expect(headerLine).toContain(memberXmi);
  expect(headerLine).toContain(domesticCurrency);
  expect(headerLine).toContain(settlementType);

  // Step 4: Verify record types presence
  console.log(`Found record types: ${foundRecordTypes.join(", ")}`);
  expect(foundRecordTypes.length).toBeGreaterThan(3); // At least header, some records, and trailer

  // Step 5: Verify trailer line (TDRC)
  expect(trailerLine).toMatch(/^TDRC/);
  console.log(`Trailer line: ${trailerLine}`);

  // Step 6: Verify trailer contains record count
  expect(recordCount).toMatch(/^\d+$/); // Should be a number
  console.log(`Record count in trailer: ${recordCount}`);

  // Step 7: Verify data lines have consistent format
  if (dataLines.length > 0) {
    dataLines.forEach((line) => {
      // Each data line should start with a known record type and have numeric fields
      expect(line).toMatch(/^(CTSX|CTRX|FISX|FIRX|CRSX|CRRX)/);

      // Split by spaces and filter out empty parts
      const parts = line.split(" ").filter((part) => part.trim().length > 0);

      // Should have multiple parts (record type + numeric fields)
      expect(parts.length).toBeGreaterThanOrEqual(4);

      // Verify numeric fields (they should be parseable as numbers or have decimal points)
      for (let i = 1; i < Math.min(parts.length, 5); i++) {
        const field = parts[i];
        // Fields should be numeric (may contain decimal points)
        expect(field).toMatch(/^[0-9.]+$/);
      }
    });
  }

  // Step 8: Verify file contains settlement information
  expect(textContent).toContain(domesticCurrency);
  expect(textContent).toContain(settlementType);

  // Step 9: Verify timestamps/date format in header
  const datePattern = /\d{8}/; // YYYYMMDD format
  expect(headerLine).toMatch(datePattern);

  console.log(
    "Reconciliation report content validation completed successfully",
  );
}
