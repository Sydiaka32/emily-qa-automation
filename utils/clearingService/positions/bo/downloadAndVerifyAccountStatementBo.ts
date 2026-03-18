import { downloadAccountStatementBo } from "./downloadAccountStatementBo";

/**
 * Utility function for downloading account statement with verification via Back Office
 */
export async function downloadAndVerifyAccountStatementBo(
  operatorToken: string,
  memberXmi: string,
  fromDate: string,
  toDate: string,
): Promise<{ response: any; body: Buffer; content: string; fileSize: number }> {
  try {
    console.log(
      `Downloading account statement for ${memberXmi} from ${fromDate} to ${toDate} via BO...`,
    );
    const downloadResult = await downloadAccountStatementBo(
      operatorToken,
      memberXmi,
      fromDate,
      toDate,
    );

    // Verify 200 response
    console.log(
      "BO Download response status:",
      downloadResult.response.status(),
    );
    if (downloadResult.response.status() !== 200) {
      new Error(
        `Expected status 200 but got ${downloadResult.response.status()}`,
      );
    }

    // Verify response has content
    if (!downloadResult.body || downloadResult.body.length === 0) {
      new Error("Downloaded account statement content is empty");
    }

    // Convert to string for verification
    const csvContent = downloadResult.body.toString("utf-8");

    // Verify it's a CSV
    if (!csvContent.includes(",")) {
      new Error("Downloaded content does not appear to be CSV format");
    }

    console.log(
      `Successfully downloaded account statement via BO for ${memberXmi}`,
    );
    console.log(`File size: ${downloadResult.body.length} bytes`);

    return {
      response: downloadResult.response,
      body: downloadResult.body,
      content: csvContent,
      fileSize: downloadResult.body.length,
    };
  } catch (error) {
    console.error("Error downloading account statement via BO:", error);
    throw error;
  }
}
