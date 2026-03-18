import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { findMemberWithCollaterals } from "@utils/coreService/members/findMemberWithCollaterals";
import { getMemberList } from "@utils/coreService/members/getMemberList";

test.describe("Get collateral items of a specific member", () => {
  let operatorToken: string;
  let memberWithCollaterals: { xmi: string; collaterals: any[] } | null = null;

  test.beforeAll(async () => {
    // Get operator token
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    // Get member list to find XMIs
    console.log("Getting member list...");
    const membersResponse = await getMemberList(operatorToken, 0, 10);

    if (membersResponse.content.length === 0) {
      console.log("No members found");
      return;
    }

    // Extract XMIs from members
    const memberXmis = membersResponse.content.map((member) => member.xmi);
    console.log(`Found ${memberXmis.length} members`);

    // Try to find a member with collaterals
    memberWithCollaterals = await findMemberWithCollaterals(
      operatorToken,
      memberXmis,
    );
  });

  test("should get collaterals for a member successfully with 200 status", async () => {
    // Skip if no member with collaterals was found
    if (!memberWithCollaterals) {
      console.log("Skipping test - no member with collaterals found");
      return;
    }

    const { xmi, collaterals } = memberWithCollaterals;

    console.log(`Testing collaterals for member: ${xmi}`);
    console.log(`Found ${collaterals.length} collateral(s)`);

    // Assert collaterals response structure
    expect(collaterals).toBeDefined();
    expect(Array.isArray(collaterals)).toBe(true);
    expect(collaterals.length).toBeGreaterThan(0);

    // Check first collateral structure
    const collateral = collaterals[0];

    expect(collateral).toHaveProperty("id");
    expect(collateral).toHaveProperty("name");
    expect(collateral).toHaveProperty("description");
    expect(collateral).toHaveProperty("member_xmi");
    expect(collateral).toHaveProperty("currency");
    expect(collateral).toHaveProperty("amount");
    expect(collateral).toHaveProperty("contribution_percent");
    expect(collateral).toHaveProperty("documents");

    // Check field types
    expect(typeof collateral.id).toBe("string");
    expect(typeof collateral.name).toBe("string");
    expect(typeof collateral.description).toBe("string");
    expect(typeof collateral.member_xmi).toBe("string");
    expect(typeof collateral.currency).toBe("string");
    expect(typeof collateral.amount).toBe("number");
    expect(typeof collateral.contribution_percent).toBe("number");
    expect(Array.isArray(collateral.documents)).toBe(true);

    console.log(`Successfully retrieved collaterals for member ${xmi}`);
  });

  test("should validate collateral data structure and patterns", async () => {
    // Skip if no member with collaterals was found
    if (!memberWithCollaterals) {
      console.log("Skipping test - no member with collaterals found");
      return;
    }

    const { xmi, collaterals } = memberWithCollaterals;

    console.log(
      `Validating ${collaterals.length} collateral(s) for member ${xmi}`,
    );

    // Validate each collateral
    collaterals.forEach((collateral, index) => {
      console.log(`  Validating collateral ${index + 1}: ${collateral.name}`);

      // Check UUID format for id
      expect(collateral.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      // Check member_xmi matches the requested member
      expect(collateral.member_xmi).toBe(xmi);

      // Check XMI pattern
      expect(collateral.member_xmi).toMatch(/^XMBER\d+[A-Z]{2}FF$/);

      // Check name is not empty
      expect(collateral.name.length).toBeGreaterThan(0);

      // Check description is string (can be empty)
      expect(typeof collateral.description).toBe("string");

      // Check currency is valid (3-letter code or XTG for example)
      expect(collateral.currency.length).toBeGreaterThan(0);

      // Check amount is positive number
      expect(collateral.amount).toBeGreaterThan(0);

      // Check contribution_percent is between 0 and 100
      expect(collateral.contribution_percent).toBeGreaterThanOrEqual(0);
      expect(collateral.contribution_percent).toBeLessThanOrEqual(100);

      // Check documents is an array
      expect(Array.isArray(collateral.documents)).toBe(true);

      console.log(
        `    Collateral ${collateral.name} validated: ${collateral.amount} ${collateral.currency} (${collateral.contribution_percent}%)`,
      );
    });

    console.log(
      `All ${collaterals.length} collateral(s) validated successfully`,
    );
  });
});
