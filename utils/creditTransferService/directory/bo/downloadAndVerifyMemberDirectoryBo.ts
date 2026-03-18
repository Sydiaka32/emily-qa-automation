import { downloadMemberDirectoryBo } from "./downloadMemberDirectoryBo";
import { DirectoryDownloadResult } from "../../../../modules/creditTransfer/directoryDownloadResult";

/**
 * Utility function for downloading member directory with verification via Back Office
 */
export async function downloadAndVerifyMemberDirectoryBo(
  operatorToken: string,
): Promise<DirectoryDownloadResult> {
  try {
    console.log("Downloading member directory via Back Office...");
    const downloadResult = await downloadMemberDirectoryBo(operatorToken);

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
      new Error("Downloaded directory content is empty");
    }

    // Convert to string and verify it contains expected headers
    const csvContent = downloadResult.body.toString("utf-8");
    const expectedHeaders = [
      "XMI",
      "Member name",
      "Credit transfer service status",
    ];

    for (const header of expectedHeaders) {
      if (!csvContent.includes(header)) {
        new Error(
          `Expected header '${header}' not found in BO directory download`,
        );
      }
    }

    console.log(`Successfully downloaded member directory via BO`);
    console.log(`File size: ${downloadResult.body.length} bytes`);

    return {
      response: downloadResult.response,
      body: downloadResult.body,
      content: csvContent,
      fileSize: downloadResult.body.length,
    };
  } catch (error) {
    console.error("Error downloading member directory via BO:", error);
    throw error;
  }
}
