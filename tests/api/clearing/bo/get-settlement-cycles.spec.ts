import { test, expect } from "@playwright/test";
import { getSettlementCycles } from "@utils/clearingService/settlementCycles/getSettlementCycles";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";

test.describe("GET /api/v1/settlement-admin/settlements (Operator View)", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get operator authentication token before running tests
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("should get settlement cycles successfully with 200 status", async () => {
    // Act
    const settlementCyclesResponse = await getSettlementCycles(operatorToken);

    // Assert
    expect(settlementCyclesResponse).toBeDefined();
    expect(settlementCyclesResponse.content).toBeDefined();
    expect(Array.isArray(settlementCyclesResponse.content)).toBe(true);
    expect(settlementCyclesResponse.content.length).toBeGreaterThan(0);

    // Assert - Check pagination structure
    expect(settlementCyclesResponse).toHaveProperty("total_pages");
    expect(settlementCyclesResponse).toHaveProperty("total_elements");
    expect(settlementCyclesResponse).toHaveProperty("number");
    expect(settlementCyclesResponse).toHaveProperty("size");
    expect(settlementCyclesResponse).toHaveProperty("first");
    expect(settlementCyclesResponse).toHaveProperty("last");
    expect(settlementCyclesResponse).toHaveProperty("has_next");
    expect(settlementCyclesResponse).toHaveProperty("has_previous");
    expect(settlementCyclesResponse).toHaveProperty("content");

    // Check types
    expect(typeof settlementCyclesResponse.total_pages).toBe("number");
    expect(typeof settlementCyclesResponse.total_elements).toBe("number");
    expect(typeof settlementCyclesResponse.number).toBe("number");
    expect(typeof settlementCyclesResponse.size).toBe("number");
    expect(typeof settlementCyclesResponse.first).toBe("boolean");
    expect(typeof settlementCyclesResponse.last).toBe("boolean");
    expect(typeof settlementCyclesResponse.has_next).toBe("boolean");
    expect(typeof settlementCyclesResponse.has_previous).toBe("boolean");

    // Skip if no settlement cycles
    if (settlementCyclesResponse.content.length === 0) {
      console.log("No settlement cycles found in response");
      return;
    }

    const settlementCycle = settlementCyclesResponse.content[0];

    // Assert - Check main settlement cycle structure
    expect(settlementCycle).toHaveProperty("settlement_cycle_id");
    expect(settlementCycle).toHaveProperty("created_at");
    expect(settlementCycle).toHaveProperty("system");
    expect(settlementCycle).toHaveProperty("type");

    // Check nested system structure
    expect(settlementCycle.system).toHaveProperty("code");
    expect(settlementCycle.system).toHaveProperty("name");
  });
});
