import { test, expect } from "@playwright/test";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getAllPositions } from "@utils/clearingService/positions/getAllPositions";

test.describe("GET /api/v1/core-admin/members (Operator View)", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get operator authentication token before running tests
    operatorToken = await getOperatorToken(
      config.operatorName, // You might need to add these to your config
      config.password,
    );
  });

  test("should get all member positions successfully with 200 status", async () => {
    // Act
    const positionsResponse = await getAllPositions(operatorToken);

    // Assert
    expect(positionsResponse).toBeDefined();
    expect(positionsResponse.content).toBeDefined();
    expect(Array.isArray(positionsResponse.content)).toBe(true);
    expect(positionsResponse.content.length).toBeGreaterThan(0);

    // Check types
    expect(typeof positionsResponse.total_pages).toBe("number");
    expect(typeof positionsResponse.total_elements).toBe("number");
    expect(typeof positionsResponse.number).toBe("number");
    expect(typeof positionsResponse.size).toBe("number");
    expect(typeof positionsResponse.first).toBe("boolean");
    expect(typeof positionsResponse.last).toBe("boolean");
    expect(typeof positionsResponse.has_next).toBe("boolean");
    expect(typeof positionsResponse.has_previous).toBe("boolean");

    // Skip if no members
    if (positionsResponse.content.length === 0) {
      console.log("No member positions found in response");
      return;
    }

    const memberPosition = positionsResponse.content[0];

    // Assert - Check main member structure
    expect(memberPosition).toHaveProperty("xmi");
    expect(memberPosition).toHaveProperty("name");
    expect(memberPosition).toHaveProperty("country");
    expect(memberPosition).toHaveProperty("status");
    expect(memberPosition).toHaveProperty("branch_name");
    expect(memberPosition).toHaveProperty("tax_ref");
    expect(memberPosition).toHaveProperty("main_contact");
    expect(memberPosition).toHaveProperty("alt_contact");
    expect(memberPosition).toHaveProperty("language");
    expect(memberPosition).toHaveProperty("address");
    expect(memberPosition).toHaveProperty("region");
    expect(memberPosition).toHaveProperty("tariff");
    expect(memberPosition).toHaveProperty("asset");
    expect(memberPosition).toHaveProperty("ledger_settings");

    // Check nested country structure
    expect(memberPosition.country).toHaveProperty("code");
    expect(memberPosition.country).toHaveProperty("name");

    // Check nested contact structures
    expect(memberPosition.main_contact).toHaveProperty("first_name");
    expect(memberPosition.main_contact).toHaveProperty("last_name");
    expect(memberPosition.main_contact).toHaveProperty("phone");
    expect(memberPosition.main_contact).toHaveProperty("email");

    expect(memberPosition.alt_contact).toHaveProperty("first_name");
    expect(memberPosition.alt_contact).toHaveProperty("last_name");
    expect(memberPosition.alt_contact).toHaveProperty("phone");
    expect(memberPosition.alt_contact).toHaveProperty("email");

    // Check nested region structure
    expect(memberPosition.region).toHaveProperty("code");
    expect(memberPosition.region).toHaveProperty("name");

    // Check nested ledger settings structure
    expect(memberPosition.ledger_settings).toHaveProperty("collateral_amount");
    expect(memberPosition.ledger_settings).toHaveProperty("global_base_limit");
    expect(memberPosition.ledger_settings).toHaveProperty(
      "global_current_limit",
    );
    expect(memberPosition.ledger_settings).toHaveProperty(
      "clr_positions_amount",
    );
    expect(memberPosition.ledger_settings).toHaveProperty(
      "reserve_positions_amount",
    );
    expect(memberPosition.ledger_settings).toHaveProperty(
      "set_positions_amount",
    );
  });
});
