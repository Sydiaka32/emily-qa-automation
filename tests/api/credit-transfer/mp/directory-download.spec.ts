import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getDirectoryAccessToken } from "@utils/creditTransferService/directory/getDirectoryAccessToken";
import { downloadAndVerifyMemberDirectory } from "@utils/creditTransferService/directory/donwloadAndVerifyMemberDirectory";

test.describe("Member Directory - Download", () => {
  let senderToken: string;

  test.beforeAll(async () => {
    // Get token for directory operations
    senderToken = await getDirectoryAccessToken(config);
  });

  test("Download member directory for credit transfer - simple", async () => {
    // Use the comprehensive directory download utility function
    const directoryResult = await downloadAndVerifyMemberDirectory(senderToken);

    // Additional assertions can be added here if needed
    expect(directoryResult.fileSize).toBeGreaterThan(0);
    expect(directoryResult.content).toContain("XMI");
    expect(directoryResult.content).toContain("Member name");
    expect(directoryResult.content).toContain("Credit transfer service status");

    // Optional: Log content type if needed
    const contentType = directoryResult.response.headers()["content-type"];
    console.log("Content-Type:", contentType);

    console.log("Directory download test completed successfully!");
  });
});
