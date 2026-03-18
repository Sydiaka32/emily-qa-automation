import { expect } from "@playwright/test";
import { MemberPositionDetails } from "../../../../modules/clearing/memberPositionDetail";

/**
 * Verify position details structure and content
 */
export function verifyPositionDetails(
  positions: MemberPositionDetails[],
  xmi: string,
): void {
  console.log(`Verifying position details for ${xmi}...`);

  // Verify we have positions
  expect(positions).toBeDefined();
  expect(Array.isArray(positions)).toBe(true);
  expect(positions.length).toBeGreaterThan(0);

  console.log(`Found ${positions.length} positions`);

  // Verify each position
  positions.forEach((position, index) => {
    console.log(`  Position ${index + 1}: ${position.code} (${position.name})`);

    // Required fields
    expect(position.code).toBeDefined();
    expect(typeof position.code).toBe("string");
    expect(position.code.length).toBeGreaterThan(0);

    expect(position.name).toBeDefined();
    expect(typeof position.name).toBe("string");

    expect(position.account_number).toBeDefined();
    expect(typeof position.account_number).toBe("string");
    expect(position.account_number).toContain(xmi); // Account number should contain XMI

    expect(position.settlement_type).toBeDefined();
    expect(typeof position.settlement_type).toBe("string");

    // Numeric fields
    expect(typeof position.clr_amount).toBe("number");
    expect(typeof position.reserved).toBe("number");
    expect(typeof position.set_amount).toBe("number");
    expect(typeof position.cash_amount).toBe("number");

    // Address fields (can be null)
    if (position.deposit_address !== null) {
      expect(typeof position.deposit_address).toBe("string");
    }

    if (position.withdrawal_address !== null) {
      expect(typeof position.withdrawal_address).toBe("string");
    }

    // Log position summary
    console.log(
      `    Type: ${position.settlement_type}, CLR: ${position.clr_amount}, Reserved: ${position.reserved}`,
    );
  });

  console.log("All position details verified");
}
