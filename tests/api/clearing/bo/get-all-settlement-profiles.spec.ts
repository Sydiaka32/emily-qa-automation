import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getAllSettlementProfiles } from "@utils/clearingService/settlementProfile/getAllSettlementProfiles";

test.describe("GET /api/v1/core-admin/members?services=clr (Operator View)", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get operator authentication token before running tests
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("should get all settlement profiles successfully with 200 status", async () => {
    // Act
    const settlementProfilesResponse =
      await getAllSettlementProfiles(operatorToken);
    console.log(settlementProfilesResponse);

    // Assert
    expect(settlementProfilesResponse).toBeDefined();
    expect(settlementProfilesResponse.content).toBeDefined();
    expect(Array.isArray(settlementProfilesResponse.content)).toBe(true);
    expect(settlementProfilesResponse.content.length).toBeGreaterThan(0);

    // Check types
    expect(typeof settlementProfilesResponse.total_pages).toBe("number");
    expect(typeof settlementProfilesResponse.total_elements).toBe("number");
    expect(typeof settlementProfilesResponse.number).toBe("number");
    expect(typeof settlementProfilesResponse.size).toBe("number");
    expect(typeof settlementProfilesResponse.first).toBe("boolean");
    expect(typeof settlementProfilesResponse.last).toBe("boolean");
    expect(typeof settlementProfilesResponse.has_next).toBe("boolean");
    expect(typeof settlementProfilesResponse.has_previous).toBe("boolean");

    // Skip if no settlement profiles
    if (settlementProfilesResponse.content.length === 0) {
      console.log("No settlement profiles found in response");
      return;
    }

    const settlementProfile = settlementProfilesResponse.content[0];

    // Assert - Check main member structure
    expect(settlementProfile).toHaveProperty("xmi");
    expect(settlementProfile).toHaveProperty("name");
    expect(settlementProfile).toHaveProperty("country");
    expect(settlementProfile).toHaveProperty("status");
    expect(settlementProfile).toHaveProperty("branch_name");
    expect(settlementProfile).toHaveProperty("tax_ref");
    expect(settlementProfile).toHaveProperty("main_contact");
    expect(settlementProfile).toHaveProperty("alt_contact");
    expect(settlementProfile).toHaveProperty("language");
    expect(settlementProfile).toHaveProperty("address");
    expect(settlementProfile).toHaveProperty("region");
    expect(settlementProfile).toHaveProperty("tariff");
    expect(settlementProfile).toHaveProperty("asset");

    // Check field types
    expect(typeof settlementProfile.xmi).toBe("string");
    expect(typeof settlementProfile.name).toBe("string");
    expect(typeof settlementProfile.status).toBe("string");
    expect(typeof settlementProfile.branch_name).toBe("string");
    expect(typeof settlementProfile.tax_ref).toBe("string");
    expect(typeof settlementProfile.address).toBe("string");
    expect(typeof settlementProfile.asset).toBe("string");
  });
});
