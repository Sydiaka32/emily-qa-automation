import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getMembersBo } from "@utils/clearingService/creditLimits/bo/getMembersBo";

test.describe("GET /api/v1/core-admin/members?services=clr (Operator View)", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("should get all member credit-limits successfully with 200 status", async () => {
    // Act
    const membersResponse = await getMembersBo(operatorToken);

    // Assert
    expect(membersResponse).toBeDefined();
    expect(membersResponse.content).toBeDefined();
    expect(Array.isArray(membersResponse.content)).toBe(true);

    // Check pagination fields
    expect(typeof membersResponse.total_pages).toBe("number");
    expect(typeof membersResponse.total_elements).toBe("number");
    expect(typeof membersResponse.number).toBe("number");
    expect(typeof membersResponse.size).toBe("number");
    expect(typeof membersResponse.first).toBe("boolean");
    expect(typeof membersResponse.last).toBe("boolean");
    expect(typeof membersResponse.has_next).toBe("boolean");
    expect(typeof membersResponse.has_previous).toBe("boolean");

    // Skip if no members
    if (membersResponse.content.length === 0) {
      console.log("No members found in response");
      return;
    }

    const member = membersResponse.content[0];

    // Check main member structure
    expect(member).toHaveProperty("xmi");
    expect(member).toHaveProperty("name");
    expect(member).toHaveProperty("country");
    expect(member).toHaveProperty("status");
    expect(member).toHaveProperty("branch_name");
    expect(member).toHaveProperty("tax_ref");
    expect(member).toHaveProperty("main_contact");
    expect(member).toHaveProperty("alt_contact");
    expect(member).toHaveProperty("language");
    expect(member).toHaveProperty("address");
    expect(member).toHaveProperty("region");
    expect(member).toHaveProperty("tariff");
    expect(member).toHaveProperty("asset");
    expect(member).toHaveProperty("ledger_settings");

    // Check field types
    expect(typeof member.xmi).toBe("string");
    expect(typeof member.name).toBe("string");
    expect(typeof member.status).toBe("string");
    expect(typeof member.branch_name).toBe("string");
    expect(typeof member.tax_ref).toBe("string");
    expect(typeof member.address).toBe("string");
    expect(typeof member.asset).toBe("string");

    // Check nested objects
    expect(typeof member.country).toBe("object");
    expect(typeof member.country.code).toBe("string");
    expect(typeof member.country.name).toBe("string");

    expect(typeof member.main_contact).toBe("object");
    expect(typeof member.main_contact.first_name).toBe("string");
    expect(typeof member.main_contact.last_name).toBe("string");
    expect(typeof member.main_contact.phone).toBe("string");
    expect(typeof member.main_contact.email).toBe("string");

    expect(typeof member.alt_contact).toBe("object");
    expect(typeof member.alt_contact.first_name).toBe("string");
    expect(typeof member.alt_contact.last_name).toBe("string");
    expect(typeof member.alt_contact.phone).toBe("string");
    expect(typeof member.alt_contact.email).toBe("string");

    expect(typeof member.region).toBe("object");
    expect(typeof member.region.code).toBe("string");
    expect(typeof member.region.name).toBe("string");

    // Check ledger settings
    expect(typeof member.ledger_settings).toBe("object");
    expect(typeof member.ledger_settings.collateral_amount).toBe("number");
    expect(typeof member.ledger_settings.global_base_limit).toBe("number");
    expect(typeof member.ledger_settings.global_current_limit).toBe("number");
    expect(typeof member.ledger_settings.clr_positions_amount).toBe("number");
    expect(typeof member.ledger_settings.reserve_positions_amount).toBe(
      "number",
    );
    expect(typeof member.ledger_settings.set_positions_amount).toBe("number");
    expect(typeof member.ledger_settings.cash_positions_amount).toBe("number");
  });

  test("should validate member data structure and patterns", async () => {
    // Act
    const membersResponse = await getMembersBo(operatorToken);

    // Skip if no members
    if (membersResponse.content.length === 0) {
      console.log("No members found in response");
      return;
    }

    // Validate each member in the response
    membersResponse.content.forEach((member, index) => {
      console.log(`Validating member ${index + 1}: ${member.xmi}`);

      // Check XMI pattern
      expect(member.xmi).toMatch(/^XMBER\d+[A-Z]{2}FF$/);

      // Check status is valid
      expect(["active", "inactive", "suspended"]).toContain(member.status);

      // Check country code
      expect(member.country.code).toMatch(/^[A-Z]{2}$/);

      // Check region code
      expect(member.region.code).toMatch(/^XR\d{3}$/);

      // Check asset is 3-letter currency code
      expect(member.asset).toMatch(/^[A-Z]{3}$/);

      // Check tariff code if present
      if (member.tariff !== null) {
        expect(member.tariff.code).toMatch(/^XT\d{3}$/);
      }

      // Check email formats
      expect(member.main_contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(member.alt_contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

      // Check phone formats
      expect(member.main_contact.phone).toMatch(/^\+\d+$/);
      expect(member.alt_contact.phone).toMatch(/^\+\d+$/);

      // Check ledger settings are valid numbers
      expect(typeof member.ledger_settings.collateral_amount).toBe("number");
      expect(typeof member.ledger_settings.global_base_limit).toBe("number");
      expect(typeof member.ledger_settings.global_current_limit).toBe("number");
      expect(typeof member.ledger_settings.clr_positions_amount).toBe("number");
      expect(typeof member.ledger_settings.reserve_positions_amount).toBe(
        "number",
      );
      expect(typeof member.ledger_settings.set_positions_amount).toBe("number");
      expect(typeof member.ledger_settings.cash_positions_amount).toBe(
        "number",
      );

      console.log(`  Member ${member.xmi} validated successfully`);
    });

    console.log(
      `All ${membersResponse.content.length} members validated successfully`,
    );
  });
});
