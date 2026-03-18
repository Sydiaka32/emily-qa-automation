import { downloadTransactionDetails } from "./downloadTransactionDetails";

/**
 * Utility function for downloading transaction details with verification
 */
export async function downloadAndVerifyTransactionDetails(
  authToken: string,
  referenceId: string,
): Promise<{ response: any; body: Buffer; content: string; fileSize: number }> {
  try {
    console.log(
      `Downloading transaction details for reference ID: ${referenceId}...`,
    );
    const downloadResult = await downloadTransactionDetails(
      authToken,
      referenceId,
    );

    // Verify 200 response
    console.log("Download response status:", downloadResult.response.status());
    if (downloadResult.response.status() !== 200) {
      new Error(
        `Expected status 200 but got ${downloadResult.response.status()}`,
      );
    }

    // Verify response has content
    if (!downloadResult.body || downloadResult.body.length === 0) {
      await new Error("Downloaded transaction details content is empty");
    }

    // Convert to string and verify it contains expected data
    const csvContent = downloadResult.body.toString("utf-8");

    // Verify it's a CSV with some expected transaction data
    if (!csvContent.includes(",")) {
      await new Error("Downloaded content does not appear to be CSV format");
    }

    console.log(
      `Successfully downloaded transaction details for ${referenceId}`,
    );
    console.log(`File size: ${downloadResult.body.length} bytes`);

    return {
      response: downloadResult.response,
      body: downloadResult.body,
      content: csvContent,
      fileSize: downloadResult.body.length,
    };
  } catch (error) {
    console.error("Error downloading transaction details:", error);
    throw error;
  }
}
