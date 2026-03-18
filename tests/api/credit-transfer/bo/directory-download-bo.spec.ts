import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { downloadAndVerifyMemberDirectoryBo } from "@utils/creditTransferService/directory/bo/downloadAndVerifyMemberDirectoryBo";

test.describe("BackOffice - Member Directory - Download", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get operator token for BO operations
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("BO: Download member directory for credit transfer - simple", async () => {
    // Use the comprehensive directory download utility function via BO
    const directoryResult =
      await downloadAndVerifyMemberDirectoryBo(operatorToken);

    // Additional assertions can be added here if needed
    expect(directoryResult.fileSize).toBeGreaterThan(0);
    expect(directoryResult.content).toContain("XMI");
    expect(directoryResult.content).toContain("Member name");
    expect(directoryResult.content).toContain("Credit transfer service status");

    // Optional: Log content type if needed
    const contentType = directoryResult.response.headers()["content-type"];
    console.log("BO Content-Type:", contentType);

    console.log("BO Directory download test completed successfully!");
  });
});
