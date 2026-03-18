import { expect } from "@playwright/test";
import { EodCycleDetails } from "../../../modules/clearing/eodCycleDetails";

/**
 * Verify EOD cycle details structure and content
 */
export function verifyEodCycleDetails(
  cycle: EodCycleDetails,
  expectedId?: string,
): void {
  console.log(`Verifying EOD cycle details: ${cycle.id}`);

  // Required fields
  expect(cycle.id).toBeDefined();
  expect(typeof cycle.id).toBe("string");
  expect(cycle.id.length).toBeGreaterThan(0);
  expect(cycle.id).toMatch(/^XES\d+$/); // Should match pattern like XES00130

  // If expected ID is provided, verify it matches
  if (expectedId) {
    expect(cycle.id).toBe(expectedId);
    console.log(`EOD cycle ID matches expected: ${expectedId}`);
  }

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
  const validStatuses = ["CREATED", "IN_PROGRESS", "COMPLETED", "FAILED"];
  expect(validStatuses).toContain(cycle.status);

  expect(cycle.records).toBeDefined();
  expect(typeof cycle.records).toBe("number");
  expect(cycle.records).toBeGreaterThanOrEqual(0);

  // Log cycle details
  console.log(`Business day: ${cycle.business_day}`);
  console.log(`Status: ${cycle.status}`);
  console.log(`Records: ${cycle.records}`);
  console.log(`Created at: ${cycle.created_at.substring(0, 19)}`);
  if (cycle.closed_at) {
    console.log(`Closed at: ${cycle.closed_at.substring(0, 19)}`);
  }

  console.log("EOD cycle details verified");
}
