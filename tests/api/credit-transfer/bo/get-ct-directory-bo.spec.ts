import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { getDirectoryBo } from "@utils/creditTransferService/directory/bo/getDirectoryBo";
import { config } from "../../../../test.config";

test.describe("BackOffice - Directory - Get Members with CT Service", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get token for the operator
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("BO: Get directory of members with default pagination", async () => {
    console.log("Testing BO directory list with default pagination...");

    // Get directory list with default parameters (page=0, size=10)
    const { body } = await getDirectoryBo(operatorToken);

    // Verify response structure
    console.log("Verifying BO response structure...");
    expect(body).toHaveProperty("total_pages");
    expect(body).toHaveProperty("total_elements");
    expect(body).toHaveProperty("number");
    expect(body).toHaveProperty("size");
    expect(body).toHaveProperty("first");
    expect(body).toHaveProperty("last");
    expect(body).toHaveProperty("has_next");
    expect(body).toHaveProperty("has_previous");
    expect(body).toHaveProperty("content");
    expect(Array.isArray(body.content)).toBe(true);

    console.log(`Total pages: ${body.total_pages}`);
    console.log(`Total elements: ${body.total_elements}`);
    console.log(`Current page: ${body.number}`);
    console.log(`Page size: ${body.size}`);
    console.log(`Has next: ${body.has_next}`);
    console.log(`Has previous: ${body.has_previous}`);
    console.log(`Number of members in BO response: ${body.content.length}`);

    // Verify pagination properties
    expect(body.number).toBe(0); // Should be first page (0-indexed)
    expect(body.size).toBe(10); // Default size
    expect(body.first).toBe(true); // Should be first page
    expect(body.size).toBeGreaterThan(0);
    expect(body.total_pages).toBeGreaterThan(0);
    expect(body.total_elements).toBeGreaterThan(0);

    // If there are members, verify their structure
    if (body.content.length > 0) {
      console.log("Verifying member structure...");
      const member = body.content[0];

      // Verify required fields in member
      expect(member).toHaveProperty("xmi");
      expect(member).toHaveProperty("name");
      expect(member).toHaveProperty("country");
      expect(member).toHaveProperty("status");
      expect(member).toHaveProperty("region");
      expect(member).toHaveProperty("address");
      expect(member).toHaveProperty("asset");

      // Verify country structure
      expect(member.country).toHaveProperty("code");
      expect(member.country).toHaveProperty("name");

      // Verify region structure
      expect(member.region).toHaveProperty("code");
      expect(member.region).toHaveProperty("name");

      // Verify valid status
      expect(member.status).toBe("active");

      // Verify XMI format (starts with XMBER)
      expect(member.xmi).toMatch(/^XMBER/);

      console.log(
        `First member: ${member.xmi} - ${member.name} (${member.country.code})`,
      );
    }

    console.log("BO Directory list test completed successfully");
  });

  test("BO: Get directory of members with custom pagination", async () => {
    console.log("Testing BO directory list with custom pagination...");

    const page = 1;
    const size = 5;

    // Get directory list with custom pagination
    const { body } = await getDirectoryBo(operatorToken, undefined, page, size);

    // Verify response structure
    expect(body).toHaveProperty("number");
    expect(body).toHaveProperty("size");
    expect(body.number).toBe(page);
    expect(body.size).toBe(size);
    expect(body.content.length).toBeLessThanOrEqual(size);

    console.log(
      `BO Custom pagination - Page: ${body.number}, Size: ${body.size}`,
    );
    console.log(`Members count: ${body.content.length}`);

    // Verify pagination flags
    if (body.total_pages > 1) {
      expect(body.has_previous).toBe(true);
    }

    if (page < body.total_pages - 1) {
      expect(body.has_next).toBe(true);
    }

    console.log("BO Custom pagination test completed successfully");
  });
});
