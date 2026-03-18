import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { getSettlementSystemsBo } from "@utils/clearingService/settlementSystems/getSettlementSystemsBo";
import { verifySettlementSystems } from "@utils/clearingService/settlementSystems/verifySettlementSystems";

test.describe("BackOffice - Settlement Systems", () => {
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

  test("BO: Get settlement systems list successfully", async () => {
    console.log("=== Testing BO settlement systems retrieval ===");

    // Get settlement systems
    console.log("Fetching settlement systems via Back Office...");
    const systemsResponse = await getSettlementSystemsBo(operatorToken);

    // Verify response structure
    console.log("\n=== Response Structure Validation ===");
    expect(systemsResponse).toBeDefined();
    expect(systemsResponse.content).toBeDefined();
    expect(Array.isArray(systemsResponse.content)).toBe(true);

    // Check pagination fields
    expect(systemsResponse.total_pages).toBeDefined();
    expect(typeof systemsResponse.total_pages).toBe("number");
    expect(systemsResponse.total_elements).toBeDefined();
    expect(typeof systemsResponse.total_elements).toBe("number");
    expect(systemsResponse.number).toBeDefined();
    expect(typeof systemsResponse.number).toBe("number");
    expect(systemsResponse.size).toBeDefined();
    expect(typeof systemsResponse.size).toBe("number");
    expect(systemsResponse.first).toBeDefined();
    expect(typeof systemsResponse.first).toBe("boolean");
    expect(systemsResponse.last).toBeDefined();
    expect(typeof systemsResponse.last).toBe("boolean");
    expect(systemsResponse.has_next).toBeDefined();
    expect(typeof systemsResponse.has_next).toBe("boolean");
    expect(systemsResponse.has_previous).toBeDefined();
    expect(typeof systemsResponse.has_previous).toBe("boolean");

    console.log(`Total pages: ${systemsResponse.total_pages}`);
    console.log(`Total elements: ${systemsResponse.total_elements}`);
    console.log(`Current page: ${systemsResponse.number}`);
    console.log(`Page size: ${systemsResponse.size}`);
    console.log(`Is first page: ${systemsResponse.first}`);
    console.log(`Is last page: ${systemsResponse.last}`);
    console.log(`Has next: ${systemsResponse.has_next}`);
    console.log(`Has previous: ${systemsResponse.has_previous}`);
    console.log(`Systems in response: ${systemsResponse.content.length}`);

    // Skip if no systems
    if (systemsResponse.content.length === 0) {
      console.log("No settlement systems found in BO response");
      return;
    }

    // Verify system structure
    verifySettlementSystems(systemsResponse.content);

    console.log("\nBO settlement systems test completed successfully");
  });
});
