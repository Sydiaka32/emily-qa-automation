import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { getDirectory } from "@utils/creditTransferService/directory/getDirectory";
import { config } from "../../../../test.config";

test.describe("Directory - Get Members with CT Service", () => {
  let memberToken: string;

  test.beforeAll(async () => {
    // Get token for the member
    memberToken = await getAccessToken(config.memberName, config.password);
  });

  test("Get directory of members with default pagination", async () => {
    console.log("Testing directory list with default pagination...");

    // Get directory list with default parameters (page=0, size=10)
    const { body } = await getDirectory(memberToken);

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
    console.log(`Number of members in response: ${body.content.length}`);

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
      expect(member).toHaveProperty("domestic_currency");

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

    console.log("Directory list test completed successfully");
  });

  test("Get directory of members with custom pagination", async () => {
    console.log("Testing directory list with custom pagination...");

    const page = 1;
    const size = 5;

    // Get directory list with custom pagination
    const { body } = await getDirectory(memberToken, undefined, page, size);

    // Verify response structure
    expect(body).toHaveProperty("number");
    expect(body).toHaveProperty("size");
    expect(body.number).toBe(page);
    expect(body.size).toBe(size);
    expect(body.content.length).toBeLessThanOrEqual(size);

    console.log(`Custom pagination - Page: ${body.number}, Size: ${body.size}`);
    console.log(`Members count: ${body.content.length}`);

    // Verify pagination flags
    if (body.total_pages > 1) {
      expect(body.has_previous).toBe(true); // Page 1 should have previous
    }

    if (page < body.total_pages - 1) {
      expect(body.has_next).toBe(true); // Should have next if not last page
    }

    console.log("Custom pagination test completed successfully");
  });

  test("Get directory of members with search filter", async () => {
    console.log("Testing directory list with search filter...");

    // Search for members by name (partial search)
    const searchTerm = "Bank";
    const { body } = await getDirectory(memberToken, searchTerm);

    // Verify response structure
    expect(body).toHaveProperty("content");
    expect(Array.isArray(body.content)).toBe(true);

    console.log(`Search term: ${searchTerm}`);
    console.log(`Found ${body.content.length} members matching search`);

    // If we found members, verify they match the search criteria
    if (body.content.length > 0) {
      body.content.forEach((member: any) => {
        // The search should match member name (case-insensitive)
        expect(member.name.toLowerCase()).toContain(searchTerm.toLowerCase());
      });

      console.log(
        `All ${body.content.length} members contain "${searchTerm}" in name`,
      );
    }

    console.log("Search filter test completed successfully");
  });

  test("Verify directory member fields are properly populated", async () => {
    console.log("Testing directory member field completeness...");

    const { body } = await getDirectory(memberToken);

    if (body.content.length > 0) {
      const member = body.content[0];

      // Verify XMI is not empty and follows expected pattern
      expect(member.xmi).toBeTruthy();
      expect(typeof member.xmi).toBe("string");
      expect(member.xmi.length).toBeGreaterThan(5);

      // Verify name is not empty
      expect(member.name).toBeTruthy();
      expect(typeof member.name).toBe("string");

      // Verify country has both code and name
      expect(member.country.code).toBeTruthy();
      expect(member.country.code.length).toBe(2); // Country codes are 2 letters
      expect(member.country.name).toBeTruthy();

      // Verify region has both code and name
      expect(member.region.code).toBeTruthy();
      expect(member.region.code).toMatch(/^XR\d+/); // Region codes start with XR
      expect(member.region.name).toBeTruthy();

      // Verify address is a string (could be empty)
      expect(typeof member.address).toBe("string");

      // Verify domestic_currency is a valid currency code
      expect(member.domestic_currency).toBeTruthy();
      expect(typeof member.domestic_currency).toBe("string");
      expect(member.domestic_currency.length).toBe(3);

      // Verify status is "active"
      expect(member.status).toBe("active");

      console.log("All member fields are properly populated and valid");
    }

    console.log("Field completeness test completed successfully");
  });
});
