import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { getRestrictions } from "@utils/creditTransferService/restrictions/getRestrictions";
import { config } from "../../../../test.config";
import { RestrictionReasonCodes } from "../../../../consts/credit-transfer/restrictionReasonCodes";

test.describe("Restrictions - Get CT Restrictions", () => {
  let memberToken: string;

  test.beforeAll(async () => {
    // Get token for the member
    memberToken = await getAccessToken(config.memberName, config.password);
  });

  test("Get restrictions list with default pagination", async () => {
    console.log("Testing restrictions list with default pagination...");

    // Get restrictions list with default parameters (page=0, size=10)
    const { body } = await getRestrictions(memberToken);

    // Verify response structure
    console.log("Verifying response structure...");
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
    console.log(`Number of restrictions in response: ${body.content.length}`);

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
        `First restriction: ${restriction.blocker.xmi} blocks ${restriction.blocked.xmi} (reason: ${restriction.reason_code})`,
      );
    } else {
      console.log("No restrictions found in the system");
    }

    console.log("Restrictions list test completed successfully");
  });

  test("Get restrictions list with custom pagination", async () => {
    console.log("Testing restrictions list with custom pagination...");

    const page = 0; // Test with first page
    const size = 5;

    // Get restrictions list with custom pagination
    const { body } = await getRestrictions(memberToken, page, size);

    // Verify response structure
    expect(body).toHaveProperty("number");
    expect(body).toHaveProperty("size");
    expect(body.number).toBe(page);
    expect(body.size).toBe(size);
    expect(body.content.length).toBeLessThanOrEqual(size);

    console.log(`Custom pagination - Page: ${body.number}, Size: ${body.size}`);
    console.log(`Restrictions count: ${body.content.length}`);

    // Verify pagination flags for first page
    expect(body.first).toBe(true);
    expect(body.has_previous).toBe(false);

    // If there are more elements than page size, should have next
    if (body.total_elements > size) {
      expect(body.has_next).toBe(true);
    }

    console.log("Custom pagination test completed successfully");
  });

  test("Verify restriction fields are properly populated", async () => {
    console.log("Testing restriction field completeness...");

    const { body } = await getRestrictions(memberToken);

    if (body.content.length > 0) {
      const restriction = body.content[0];

      // Verify blocker object
      expect(restriction.blocker.xmi).toBeTruthy();
      expect(typeof restriction.blocker.xmi).toBe("string");
      expect(restriction.blocker.xmi).toMatch(/^XMBER/);
      expect(restriction.blocker.name).toBeTruthy();
      expect(typeof restriction.blocker.name).toBe("string");

      // Verify blocked object
      expect(restriction.blocked.xmi).toBeTruthy();
      expect(typeof restriction.blocked.xmi).toBe("string");
      expect(restriction.blocked.xmi).toMatch(/^XMBER/);
      expect(restriction.blocked.name).toBeTruthy();
      expect(typeof restriction.blocked.name).toBe("string");

      // Verify blocker and blocked are different
      expect(restriction.blocker.xmi).not.toBe(restriction.blocked.xmi);

      // Verify reason code
      expect(restriction.reason_code).toBeTruthy();
      expect(typeof restriction.reason_code).toBe("string");
      expect(Object.values(RestrictionReasonCodes)).toContain(
        restriction.reason_code,
      );

      // Verify blocked_at timestamp
      expect(restriction.blocked_at).toBeTruthy();
      expect(typeof restriction.blocked_at).toBe("string");

      // Parse and verify the date is valid
      const blockedDate = new Date(restriction.blocked_at);
      expect(blockedDate.toString()).not.toBe("Invalid Date");

      // Verify it's not a future date (unless time travel is involved)
      expect(blockedDate.getTime()).toBeLessThanOrEqual(Date.now());

      console.log("All restriction fields are properly populated and valid");
    } else {
      console.log("No restrictions found to validate fields");
    }

    console.log("Field completeness test completed successfully");
  });
});
