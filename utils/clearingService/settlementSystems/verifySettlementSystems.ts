import { SettlementSystem } from "../../../modules/clearing/settlementSystem";
import { expect } from "@playwright/test";

/**
 * Verify settlement systems structure and content
 */
export function verifySettlementSystems(systems: SettlementSystem[]): void {
  console.log(`Verifying ${systems.length} settlement systems...`);

  systems.forEach((system, index) => {
    console.log(`  System ${index + 1}: ${system.code} (${system.name})`);

    // Required fields
    expect(system.code).toBeDefined();
    expect(typeof system.code).toBe("string");
    expect(system.code.length).toBeGreaterThan(0);
    expect(system.code).toMatch(/^XSS\d+$/); // Should match pattern like XSS00001

    expect(system.name).toBeDefined();
    expect(typeof system.name).toBe("string");
    expect(system.name.length).toBeGreaterThan(0);

    expect(system.rtgs_support).toBeDefined();
    expect(typeof system.rtgs_support).toBe("string");
    expect(["YES", "NO"]).toContain(system.rtgs_support);

    expect(system.adapter).toBeDefined();
    expect(typeof system.adapter).toBe("string");
    expect(system.adapter.length).toBeGreaterThan(0);

    // Log system details
    console.log(
      `    RTGS Support: ${system.rtgs_support}, Adapter: ${system.adapter}`,
    );
  });

  console.log("All settlement systems verified");
}
