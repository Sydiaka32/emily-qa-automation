import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getResourceFilesBo } from "@utils/coreService/resources/getResourceFilesBo";

test.describe("BackOffice - Core Admin - Get Resource Files", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");
  });

  test("BO: Get all resource files successfully with 200 status", async () => {
    console.log("=== Testing get resource files via Back Office ===");

    // Act
    const result = await getResourceFilesBo(operatorToken);

    // Verify response status
    const response = result.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Get the response body
    const resourceFiles = result.body;
    console.log("Response body:", resourceFiles);

    // Verify response structure
    expect(Array.isArray(resourceFiles)).toBe(true);
    console.log(`Response is an array with ${resourceFiles.length} items`);

    // Skip detailed validation if no resource files
    if (resourceFiles.length === 0) {
      console.log("No resource files found in response");
      return;
    }

    // Check first resource file structure
    const resourceFile = resourceFiles[0];
    console.log(`First resource file:`, resourceFile);

    // Check resource file structure
    expect(resourceFile).toHaveProperty("id");
    expect(resourceFile).toHaveProperty("name");
    expect(resourceFile).toHaveProperty("version");
    expect(resourceFile).toHaveProperty("originalFilename");

    // Check field types
    expect(typeof resourceFile.id).toBe("string");
    expect(typeof resourceFile.name).toBe("string");
    expect(typeof resourceFile.version).toBe("string");
    expect(typeof resourceFile.originalFilename).toBe("string");

    console.log("Resource files structure validated successfully");
  });
});
