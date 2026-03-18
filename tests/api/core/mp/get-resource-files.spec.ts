import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getResourceFilesMp } from "@utils/coreService/resources/getResourceFilesMp";

test.describe("GET /api/v1/core/resource-files (Member Portal)", () => {
  let memberToken: string;

  test.beforeAll(async () => {
    memberToken = await getAccessToken(config.memberName, config.password);
  });

  test("should get all resource files successfully with 200 status", async () => {
    // Act
    const resourceFiles = await getResourceFilesMp(memberToken);
    console.log(resourceFiles);

    // Assert
    expect(resourceFiles).toBeDefined();
    expect(Array.isArray(resourceFiles)).toBe(true);

    // Skip if no resource files
    if (resourceFiles.length === 0) {
      console.log("No resource files found in response");
      return;
    }

    const resourceFile = resourceFiles[0];

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
  });

  test("should validate resource file data structure and patterns", async () => {
    // Act
    const resourceFiles = await getResourceFilesMp(memberToken);

    // Skip if no resource files
    if (resourceFiles.length === 0) {
      console.log("No resource files found in response");
      return;
    }

    // Validate each resource file in the response
    resourceFiles.forEach((resourceFile, index) => {
      console.log(
        `Validating resource file ${index + 1}: ${resourceFile.name}`,
      );

      // Check UUID format for id
      expect(resourceFile.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      // Check name is not empty
      expect(resourceFile.name.length).toBeGreaterThan(0);

      // Check version follows semantic versioning pattern (x.y.z)
      expect(resourceFile.version).toMatch(/^\d+\.\d+\.\d+$/);

      // Check originalFilename has extension
      expect(resourceFile.originalFilename).toMatch(/\.[a-zA-Z0-9]+$/);

      console.log(
        `  Resource file ${resourceFile.name} (v${resourceFile.version}) validated successfully`,
      );
    });

    console.log(
      `All ${resourceFiles.length} resource files validated successfully`,
    );
  });
});
