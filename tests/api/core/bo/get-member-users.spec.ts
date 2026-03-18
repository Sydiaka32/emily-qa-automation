import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getMemberList } from "@utils/coreService/members/getMemberList";
import { getMemberUsersBo } from "@utils/coreService/members/bo/getMemberUsersBo";

test.describe("Get list of users assigned for a specific member", () => {
  let operatorToken: string;
  let testMemberXmi: string;

  test.beforeAll(async () => {
    // Get operator token
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // Get member list to find a member for testing
    console.log("Getting member list for users test...");
    const membersResponse = await getMemberList(operatorToken, 0, 10);

    if (membersResponse.content.length === 0) {
      console.log("No members found");
      return;
    }

    // Use the first member for testing
    testMemberXmi = membersResponse.content[0].xmi;
    console.log(`Selected member for test: ${testMemberXmi}`);
  });

  test("should get users for a member successfully with 200 status", async () => {
    // Skip if no member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no member found");
      return;
    }

    console.log(`Testing users retrieval for member: ${testMemberXmi}`);

    // Act
    const usersResponse = await getMemberUsersBo(operatorToken, testMemberXmi);
    console.log(
      `Response received with ${usersResponse.content.length} user(s)`,
    );

    // Assert
    expect(usersResponse).toBeDefined();
    expect(usersResponse.content).toBeDefined();
    expect(Array.isArray(usersResponse.content)).toBe(true);

    // Check pagination fields
    expect(typeof usersResponse.total_pages).toBe("number");
    expect(typeof usersResponse.total_elements).toBe("number");
    expect(typeof usersResponse.number).toBe("number");
    expect(typeof usersResponse.size).toBe("number");
    expect(typeof usersResponse.first).toBe("boolean");
    expect(typeof usersResponse.last).toBe("boolean");
    expect(typeof usersResponse.has_next).toBe("boolean");
    expect(typeof usersResponse.has_previous).toBe("boolean");

    console.log(`Total pages: ${usersResponse.total_pages}`);
    console.log(`Total elements: ${usersResponse.total_elements}`);
    console.log(`Current page: ${usersResponse.number}`);
    console.log(`Page size: ${usersResponse.size}`);
    console.log(`Users in response: ${usersResponse.content.length}`);

    // Skip if no users
    if (usersResponse.content.length === 0) {
      console.log("No users found for this member");
      return;
    }

    // Check first user structure
    const user = usersResponse.content[0];

    // Check user structure
    expect(user).toHaveProperty("first_name");
    expect(user).toHaveProperty("last_name");
    expect(user).toHaveProperty("phone_number");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("role");
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("active");

    // Check field types
    expect(typeof user.first_name).toBe("string");
    expect(typeof user.last_name).toBe("string");
    expect(typeof user.phone_number).toBe("string");
    expect(typeof user.email).toBe("string");
    expect(typeof user.role).toBe("string");
    expect(typeof user.id).toBe("string");
    expect(typeof user.active).toBe("boolean");

    console.log(`Successfully retrieved users for member ${testMemberXmi}`);
  });

  test("should validate member users data structure and patterns", async () => {
    // Skip if no member was found
    if (!testMemberXmi) {
      console.log("Skipping test - no member found");
      return;
    }

    console.log(`Validating users data for member: ${testMemberXmi}`);

    const usersResponse = await getMemberUsersBo(operatorToken, testMemberXmi);

    // Skip if no users
    if (usersResponse.content.length === 0) {
      console.log("No users to validate");
      return;
    }

    console.log(`Validating ${usersResponse.content.length} user(s)`);

    // Validate each user in the response
    usersResponse.content.forEach((user, index) => {
      console.log(`  Validating user ${index + 1}: ${user.email}`);

      // Check UUID format for id
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      // Check names are not empty
      expect(user.first_name.length).toBeGreaterThan(0);
      expect(user.last_name.length).toBeGreaterThan(0);

      // Check email format
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

      // Check phone format (starts with +)
      expect(user.phone_number).toMatch(/^\+\d+$/);

      // Check role is valid
      const validRoles = ["admin", "user", "delegated_admin"];
      expect(validRoles).toContain(user.role);

      // Check active is boolean
      expect([true, false]).toContain(user.active);

      console.log(
        `    User ${user.first_name} ${user.last_name} validated: ${user.role} (${user.active ? "active" : "inactive"})`,
      );
    });

    console.log(
      `All ${usersResponse.content.length} user(s) validated successfully`,
    );
  });
});
