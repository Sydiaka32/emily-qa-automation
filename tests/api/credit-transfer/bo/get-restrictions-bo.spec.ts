import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { getRestrictionsBo } from "@utils/creditTransferService/restrictions/bo/getRestrictionsBo";
import { config } from "../../../../test.config";
import { RestrictionReasonCodes } from "../../../../consts/credit-transfer/restrictionReasonCodes";

test.describe("BackOffice - Restrictions - Get CT Restrictions", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get token for the operator
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("BO: Get restrictions list with default pagination", async () => {
    console.log("Testing BO restrictions list with default pagination...");

    // Get restrictions list with default parameters (page=0, size=10)
    const { body } = await getRestrictionsBo(operatorToken);

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
    console.log(
      `Number of restrictions in BO response: ${body.content.length}`,
    );

    // Verify pagination properties
    expect(body.number).toBe(0); // Should be first page (0-indexed)
    expect(body.size).toBe(10); // Default size
    expect(body.first).toBe(true); // Should be first page
    expect(body.size).toBeGreaterThan(0);
    expect(body.total_pages).toBeGreaterThanOrEqual(0);
    expect(body.total_elements).toBeGreaterThanOrEqual(0);

    // If there are restrictions, verify their structure
    if (body.content.length > 0) {
      console.log("Verifying restriction structure...");
      const restriction = body.content[0];

      // Verify required fields in restriction
      expect(restriction).toHaveProperty("blocker");
      expect(restriction).toHaveProperty("blocked");
      expect(restriction).toHaveProperty("reason_code");
      expect(restriction).toHaveProperty("blocked_at");

      // Verify blocker structure
      expect(restriction.blocker).toHaveProperty("xmi");
      expect(restriction.blocker).toHaveProperty("name");

      // Verify blocked structure
      expect(restriction.blocked).toHaveProperty("xmi");
      expect(restriction.blocked).toHaveProperty("name");

      // Verify reason code is valid
      const validReasonCodes = Object.values(RestrictionReasonCodes);
      expect(validReasonCodes).toContain(restriction.reason_code);

      // Verify blocked_at is a valid date string
      expect(new Date(restriction.blocked_at).toString()).not.toBe(
        "Invalid Date",
      );

      // Verify XMI formats
      expect(restriction.blocker.xmi).toMatch(/^XMBER/);
      expect(restriction.blocked.xmi).toMatch(/^XMBER/);

      console.log(
        `First BO restriction: ${restriction.blocker.xmi} blocks ${restriction.blocked.xmi} (reason: ${restriction.reason_code})`,
      );
    } else {
      console.log("No restrictions found in the BO system");
    }

    console.log("BO Restrictions list test completed successfully");
  });

  test("BO: Get restrictions list with custom pagination", async () => {
    console.log("Testing BO restrictions list with custom pagination...");

    const page = 0; // Test with first page
    const size = 5;

    // Get restrictions list with custom pagination
    const { body } = await getRestrictionsBo(operatorToken, page, size);

    // Verify response structure
    expect(body).toHaveProperty("number");
    expect(body).toHaveProperty("size");
    expect(body.number).toBe(page);
    expect(body.size).toBe(size);
    expect(body.content.length).toBeLessThanOrEqual(size);

    console.log(
      `BO Custom pagination - Page: ${body.number}, Size: ${body.size}`,
    );
    console.log(`Restrictions count: ${body.content.length}`);

    // Verify pagination flags for first page
    expect(body.first).toBe(true);
    expect(body.has_previous).toBe(false);

    // If there are more elements than page size, should have next
    if (body.total_elements > size) {
      expect(body.has_next).toBe(true);
    }

    console.log("BO Custom pagination test completed successfully");
  });
});
