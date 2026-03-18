import { EodCycle } from "../../../modules/clearing/eodCycle";
import { expect } from "@playwright/test";

/**
 * Verify EOD cycles structure and content
 */
export function verifyEodCycles(cycles: EodCycle[]): void {
  console.log(`Verifying ${cycles.length} EOD cycles...`);

  cycles.forEach((cycle, index) => {
    console.log(`  Cycle ${index + 1}: ${cycle.id} (${cycle.business_day})`);

    // Required fields
    expect(cycle.id).toBeDefined();
    expect(typeof cycle.id).toBe("string");
    expect(cycle.id.length).toBeGreaterThan(0);
    expect(cycle.id).toMatch(/^XES\d+$/); // Should match pattern like XES00131

    expect(cycle.business_day).toBeDefined();
    expect(typeof cycle.business_day).toBe("string");
    expect(cycle.business_day).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format

    expect(cycle.created_at).toBeDefined();
    expect(typeof cycle.created_at).toBe("string");
    expect(cycle.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format

    // closed_at can be null or ISO string
    if (cycle.closed_at !== null) {
      expect(typeof cycle.closed_at).toBe("string");
      expect(cycle.closed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }

    expect(cycle.status).toBeDefined();
    expect(typeof cycle.status).toBe("string");
    const validStatuses = ["CREATED", "COMPLETED"];
    expect(validStatuses).toContain(cycle.status);

    expect(cycle.records).toBeDefined();
    expect(typeof cycle.records).toBe("number");
    expect(cycle.records).toBeGreaterThanOrEqual(0);

    // Log cycle details
    console.log(`    Status: ${cycle.status}, Records: ${cycle.records}`);
    console.log(`    Created: ${cycle.created_at.substring(0, 19)}`);
    if (cycle.closed_at) {
      console.log(`    Closed: ${cycle.closed_at.substring(0, 19)}`);
    }
  });

  console.log("All EOD cycles verified");
}
