import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../../test.config";
import { extractUserIdFromToken } from "@utils/general/jwtUtils";
import { getUserProfile } from "@utils/coreService/users/getUserProfile";

test.describe("GET /api/v1/core/users/{userId} (Member Portal)", () => {
  let memberToken: string;
  let userId: string;

  test.beforeAll(async () => {
    // Get access token
    memberToken = await getAccessToken(config.memberName, config.password);

    // Extract user ID from token
    userId = extractUserIdFromToken(memberToken);
    console.log(`Extracted user ID from token: ${userId}`);
  });

  test("should get user profile successfully with 200 status", async () => {
    // Act
    const userProfile = await getUserProfile(memberToken, userId);
    console.log(userProfile);

    // Assert
    expect(userProfile).toBeDefined();

    // Check user profile structure
    expect(userProfile).toHaveProperty("first_name");
    expect(userProfile).toHaveProperty("last_name");
    expect(userProfile).toHaveProperty("phone_number");
    expect(userProfile).toHaveProperty("email");
    expect(userProfile).toHaveProperty("role");
    expect(userProfile).toHaveProperty("id");
    expect(userProfile).toHaveProperty("active");

    // Check field types
    expect(typeof userProfile.first_name).toBe("string");
    expect(typeof userProfile.last_name).toBe("string");
    expect(typeof userProfile.phone_number).toBe("string");
    expect(typeof userProfile.email).toBe("string");
    expect(typeof userProfile.role).toBe("string");
    expect(typeof userProfile.id).toBe("string");
    expect(typeof userProfile.active).toBe("boolean");
  });

  test("should validate user profile data structure and patterns", async () => {
    // Act
    const userProfile = await getUserProfile(memberToken, userId);

    console.log(
      `Validating user profile for: ${userProfile.first_name} ${userProfile.last_name}`,
    );

    // Check user ID matches the extracted one
    expect(userProfile.id).toBe(userId);

    // Check UUID format for id
    expect(userProfile.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // Check names are not empty
    expect(userProfile.first_name.length).toBeGreaterThan(0);
    expect(userProfile.last_name.length).toBeGreaterThan(0);

    // Check email format
    expect(userProfile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    // Check phone format (starts with +)
    expect(userProfile.phone_number).toMatch(/^\+\d+$/);

    // Check role is valid
    const validRoles = ["admin", "user", "delegated_admin"];
    expect(validRoles).toContain(userProfile.role);

    // Check active is boolean
    expect([true, false]).toContain(userProfile.active);

    console.log(
      `  User ${userProfile.first_name} ${userProfile.last_name} validated successfully`,
    );
    console.log(`  Email: ${userProfile.email}`);
    console.log(`  Phone: ${userProfile.phone_number}`);
    console.log(`  Role: ${userProfile.role}`);
    console.log(`  Active: ${userProfile.active}`);
  });
});
