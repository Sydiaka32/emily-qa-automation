import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { extractUserIdFromTokenBo } from "@utils/general/jwtUtilsBo";
import { config } from "../../../../test.config";
import { getOperatorProfileBo } from "@utils/coreService/users/bo/getOperatorProfileBo";

test.describe("BackOffice - Core Admin - Get Operator Profile", () => {
  let operatorToken: string;
  let operatorId: string;

  test.beforeAll(async () => {
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Extract operator ID from token
    operatorId = extractUserIdFromTokenBo(operatorToken);
    console.log(`Extracted operator ID from token: ${operatorId}`);
  });

  test("BO: Get operator profile successfully with 200 status", async () => {
    console.log("=== Testing get operator profile ===");

    // Act
    const result = await getOperatorProfileBo(operatorToken, operatorId);

    // Verify response status
    const response = result.response;
    const status = response.status();

    console.log(`Response status: ${status}`);
    console.log(`Expected: 200`);

    expect(status).toBe(200);
    console.log("Status 200 verified");

    // Get the response body
    const operatorProfile = result.body;
    console.log("Operator profile:", operatorProfile);

    // Check operator profile structure
    expect(operatorProfile).toHaveProperty("first_name");
    expect(operatorProfile).toHaveProperty("last_name");
    expect(operatorProfile).toHaveProperty("phone_number");
    expect(operatorProfile).toHaveProperty("email");
    expect(operatorProfile).toHaveProperty("role");
    expect(operatorProfile).toHaveProperty("id");
    expect(operatorProfile).toHaveProperty("active");

    console.log("All required fields present in operator profile");

    // Check field types
    expect(typeof operatorProfile.first_name).toBe("string");
    expect(typeof operatorProfile.last_name).toBe("string");
    expect(typeof operatorProfile.phone_number).toBe("string");
    expect(typeof operatorProfile.email).toBe("string");
    expect(typeof operatorProfile.role).toBe("string");
    expect(typeof operatorProfile.id).toBe("string");
    expect(typeof operatorProfile.active).toBe("boolean");

    console.log("All field types are correct");
  });

  test("BO: Validate operator profile data structure and patterns", async () => {
    console.log("=== Testing operator profile data validation ===");

    // Act
    const result = await getOperatorProfileBo(operatorToken, operatorId);
    expect(result.response.status()).toBe(200);

    const operatorProfile = result.body;

    console.log(
      `Validating operator profile for: ${operatorProfile.first_name} ${operatorProfile.last_name}`,
    );

    // Check operator ID matches the extracted one
    expect(operatorProfile.id).toBe(operatorId);
    console.log(`Operator ID matches: ${operatorProfile.id}`);

    // Check UUID format for id
    expect(operatorProfile.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    console.log(`Operator ID is valid UUID format`);

    // Check names are not empty
    expect(operatorProfile.first_name.length).toBeGreaterThan(0);
    expect(operatorProfile.last_name.length).toBeGreaterThan(0);
    console.log(`First name and last name are not empty`);

    // Check email format
    expect(operatorProfile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    console.log(`Email format is valid: ${operatorProfile.email}`);

    // Check phone format (starts with +)
    expect(operatorProfile.phone_number).toMatch(/^\+\d+$/);
    console.log(
      `Phone number format is valid: ${operatorProfile.phone_number}`,
    );

    // Check role is valid (assuming same roles as MP)
    const validRoles = ["admin", "user", "delegated_admin"];
    expect(validRoles).toContain(operatorProfile.role);
    console.log(`Role is valid: ${operatorProfile.role}`);

    // Check active is boolean
    expect([true, false]).toContain(operatorProfile.active);
    console.log(`Active status is valid boolean: ${operatorProfile.active}`);

    console.log(
      `Operator ${operatorProfile.first_name} ${operatorProfile.last_name} validated successfully`,
    );
    console.log(`  Email: ${operatorProfile.email}`);
    console.log(`  Phone: ${operatorProfile.phone_number}`);
    console.log(`  Role: ${operatorProfile.role}`);
    console.log(`  Active: ${operatorProfile.active}`);
  });
});
