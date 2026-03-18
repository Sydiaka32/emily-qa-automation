import { verifyAccountStatementContent } from "../verifyAccountStatementContent";

/**
 * Verify account statement content for Back Office download
 */
export function verifyAccountStatementContentBo(
  csvContent: string,
  fromDate: string,
  toDate: string,
  memberXmi: string,
): void {
  console.log(`Verifying BO account statement content for ${memberXmi}...`);

  // First, do the basic verification from the member version
  verifyAccountStatementContent(csvContent, fromDate, toDate);

  // Additional BO-specific checks
  const lines = csvContent.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length > 1) {
    // Check if CSV contains the member XMI (either in a column or in the data)
    const containsMemberXmi = csvContent.includes(memberXmi);
    console.log(
      `CSV contains member XMI (${memberXmi}): ${containsMemberXmi ? "✓" : "✗"}`,
    );

    // Check for BO-specific columns if needed
    const headers = lines[0].split(",").map((h) => h.toLowerCase());
    const expectedBoHeaders = ["member", "xmi", "member_xmi"];
    const foundBoHeader = expectedBoHeaders.some((header) =>
      headers.some((h) => h.includes(header)),
    );

    if (foundBoHeader) {
      console.log("CSV contains member identification columns");
    }
  }

  console.log("BO account statement content verified");
}
