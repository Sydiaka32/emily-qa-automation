import { expect } from "@playwright/test";
import { downloadReconciliationReportBo } from "./downloadReconciliationReportBo";
import { SettlementTypes } from "../../../../consts/clearing/settlementTypes";
import { ReconciliationReportResult } from "../../../../modules/creditTransfer/ReconciliationReportResult";
import { generateReconciliationReportFilename } from "@utils/creditTransferService/creditTransfer/generateReconciliationReportFilename";

/**
 * Downloads the reconciliation report via Back Office
 */
export async function executeReconciliationReportDownloadBo(
  memberXmi: string,
  domesticCurrency: string,
  operatorToken: string,
  settlementType: string = SettlementTypes.dns,
): Promise<ReconciliationReportResult> {
  console.log("Executing BO reconciliation report download and validation...");

  // Generate filename
  const filename = generateReconciliationReportFilename(
    memberXmi,
    domesticCurrency,
    settlementType,
  );
  console.log(`Downloading BO reconciliation report: ${filename}`);

  // Download report via BO
  const downloadResult = await downloadReconciliationReportBo(
    filename,
    operatorToken,
  );

  // Verify 200 response and content
  expect(downloadResult.response.status()).toBe(200);
  expect(downloadResult.body).toBeDefined();
  expect(downloadResult.body.length).toBeGreaterThan(0);

  // Convert to text and validate structure
  const textContent = downloadResult.body.toString("utf-8");
  console.log(`Successfully downloaded BO reconciliation report`);
  console.log(`File size: ${downloadResult.body.length} bytes`);
  console.log("File content preview (first 1000 chars):");
  console.log(textContent.substring(0, 1000) + "...");

  // Process file content
  const lines = textContent
    .split("\n")
    .filter((line) => line.trim().length > 0);
  const dataLines = lines.filter(
    (line) => !line.startsWith("HDRC") && !line.startsWith("TDRC"),
  );

  // Identify record types
  const recordTypes = [
    "HDRC", // Header
    "CTSX", // Credit Transfer Sent
    "CTRX", // Credit Transfer Received
    "FISX", // Financial Institution Sent
    "FIRX", // Financial Institution Received
    "CRSX", // Credit Return Sent
    "CRRX", // Credit Return Received
    "TDRC", // Trailer
  ];

  const foundRecordTypes = recordTypes.filter((recordType) =>
    lines.some((line) => line.startsWith(recordType)),
  );

  // Extract header and trailer
  const headerLine = lines[0];
  const trailerLine = lines[lines.length - 1];
  const trailerParts = trailerLine.split(" ");
  const recordCount = trailerParts[trailerParts.length - 1].trim();

  return {
    filename,
    downloadResult,
    textContent,
    lines,
    dataLines,
    foundRecordTypes,
    headerLine,
    trailerLine,
    recordCount,
  };
}
