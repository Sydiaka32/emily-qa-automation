import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { getEodCyclesBo } from "@utils/clearingService/eodCycles/getEodCyclesBo";
import { verifyEodCycles } from "@utils/clearingService/eodCycles/verifyEodCycles";

test.describe("BackOffice - EOD Cycles", () => {
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get operator token for BO operations
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");
  });

  test("BO: Get EOD cycles list successfully", async () => {
    console.log("=== Testing BO EOD cycles retrieval ===");

    // Get EOD cycles
    console.log("Fetching EOD cycles via Back Office...");
    const cyclesResponse = await getEodCyclesBo(operatorToken);

    // Verify response structure
    console.log("=== Response Structure Validation ===");
    expect(cyclesResponse).toBeDefined();
    expect(cyclesResponse.content).toBeDefined();
    expect(Array.isArray(cyclesResponse.content)).toBe(true);

    // Check pagination fields
    expect(cyclesResponse.total_pages).toBeDefined();
    expect(typeof cyclesResponse.total_pages).toBe("number");
    expect(cyclesResponse.total_elements).toBeDefined();
    expect(typeof cyclesResponse.total_elements).toBe("number");
    expect(cyclesResponse.number).toBeDefined();
    expect(typeof cyclesResponse.number).toBe("number");
    expect(cyclesResponse.size).toBeDefined();
    expect(typeof cyclesResponse.size).toBe("number");
    expect(cyclesResponse.first).toBeDefined();
    expect(typeof cyclesResponse.first).toBe("boolean");
    expect(cyclesResponse.last).toBeDefined();
    expect(typeof cyclesResponse.last).toBe("boolean");
    expect(cyclesResponse.has_next).toBeDefined();
    expect(typeof cyclesResponse.has_next).toBe("boolean");
    expect(cyclesResponse.has_previous).toBeDefined();
    expect(typeof cyclesResponse.has_previous).toBe("boolean");

    console.log(`Total pages: ${cyclesResponse.total_pages}`);
    console.log(`Total elements: ${cyclesResponse.total_elements}`);
    console.log(`Current page: ${cyclesResponse.number}`);
    console.log(`Page size: ${cyclesResponse.size}`);
    console.log(`Is first page: ${cyclesResponse.first}`);
    console.log(`Is last page: ${cyclesResponse.last}`);
    console.log(`Has next: ${cyclesResponse.has_next}`);
    console.log(`Has previous: ${cyclesResponse.has_previous}`);
    console.log(`Cycles in response: ${cyclesResponse.content.length}`);

    // Skip if no cycles
    if (cyclesResponse.content.length === 0) {
      console.log("No EOD cycles found in BO response");
      return;
    }

    // Verify cycles structure
    verifyEodCycles(cyclesResponse.content);

    console.log("BO EOD cycles test completed successfully");
  });
});
