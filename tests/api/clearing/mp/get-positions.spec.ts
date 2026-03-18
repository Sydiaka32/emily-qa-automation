import { test, expect } from "@playwright/test";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { getPositions } from "@utils/clearingService/positions/getPositions";

test.describe("GET /api/v1/ledger/positions", () => {
  let authToken: string;

  test.beforeAll(async () => {
    // Get authentication token before running tests
    authToken = await getAccessToken(config.memberName, config.password);
  });

  test("should get positions successfully with 200 status", async () => {
    // Act
    const positions = await getPositions(authToken);

    // Assert
    expect(positions).toBeDefined();
    expect(Array.isArray(positions)).toBe(true);
    expect(positions.length).toBeGreaterThan(0);

    // Assert
    const firstPosition = positions[0];

    // Check required fields exist
    expect(firstPosition).toHaveProperty("code");
    expect(firstPosition).toHaveProperty("name");
    expect(firstPosition).toHaveProperty("account_number");
    expect(firstPosition).toHaveProperty("settlement_type");
    expect(firstPosition).toHaveProperty("clr_amount");
    expect(firstPosition).toHaveProperty("reserved");
    expect(firstPosition).toHaveProperty("set_amount");

    // Check field types
    expect(typeof firstPosition.code).toBe("string");
    expect(typeof firstPosition.name).toBe("string");
    expect(typeof firstPosition.account_number).toBe("string");
    expect(typeof firstPosition.settlement_type).toBe("string");
    expect(typeof firstPosition.clr_amount).toBe("number");
    expect(typeof firstPosition.reserved).toBe("number");
    expect(typeof firstPosition.set_amount).toBe("number");
  });
});
