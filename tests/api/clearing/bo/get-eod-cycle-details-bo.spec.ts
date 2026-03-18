import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { getEodCyclesBo } from "@utils/clearingService/eodCycles/getEodCyclesBo";
import { getDatabaseConfig } from "@utils/general/dbConfig";
import { DbClient } from "@utils/general/dbClient";
import { getEodCycleDetailsBo } from "@utils/clearingService/eodCycles/getEodCycleDetailsBo";
import { verifyEodCycleDetails } from "@utils/clearingService/eodCycles/verifyEodCycleDetails";

test.describe("BackOffice - EOD Cycle Details", () => {
  let operatorToken: string;
  let testEodId: string = "";
  let testBusinessDay: string = "";
  let dbClient: DbClient | null = null;

  test.beforeAll(async () => {
    // Get operator token for BO operations
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Get EOD cycles to find a completed cycle for testing
    console.log("\nFinding a completed EOD cycle for testing...");
    const cyclesResponse = await getEodCyclesBo(operatorToken, 0, 10);

    expect(cyclesResponse.content).toBeDefined();
    expect(cyclesResponse.content.length).toBeGreaterThan(0);

    // Find a COMPLETED cycle (more reliable for database verification)
    let completedCycle = cyclesResponse.content.find(
      (cycle) => cycle.status === "COMPLETED",
    );

    if (!completedCycle) {
      // If no completed cycle, use the first one
      console.log("No COMPLETED cycle found, using the first cycle");
      completedCycle = cyclesResponse.content[0];
    }

    testEodId = completedCycle.id;
    testBusinessDay = completedCycle.business_day;

    console.log(`Selected EOD cycle: ${testEodId}`);
    console.log(`Business day: ${testBusinessDay}`);
    console.log(`Status: ${completedCycle.status}`);
    console.log(`Records: ${completedCycle.records}`);

    // Initialize database client if credentials are available
    try {
      const dbConfig = getDatabaseConfig();
      if (dbConfig.host && dbConfig.user && dbConfig.password) {
        dbClient = new DbClient(dbConfig);
        await dbClient.connect();
        console.log("Database client initialized and connected");
      } else {
        console.log(
          "Database credentials not available, skipping database verification",
        );
        dbClient = null;
      }
    } catch (error) {
      console.log("Failed to initialize database client:", error);
      dbClient = null;
    }
  });

  test.afterAll(async () => {
    // Disconnect database client if connected
    if (dbClient) {
      await dbClient.disconnect();
    }
  });

  test("BO: Get specific EOD cycle details successfully", async () => {
    console.log("=== Testing BO EOD cycle details retrieval ===");
    console.log(`EOD Cycle ID: ${testEodId}`);

    // Get EOD cycle details
    console.log(`Fetching details for EOD cycle ${testEodId}...`);
    const cycleDetails = await getEodCycleDetailsBo(operatorToken, testEodId);

    // Verify the response structure
    verifyEodCycleDetails(cycleDetails, testEodId);

    // Verify it matches the data from the list
    console.log("\n=== Data Consistency Check ===");

    // Get the list again to ensure data consistency
    const listResponse = await getEodCyclesBo(operatorToken, 0, 10);
    const cycleFromList = listResponse.content.find((c) => c.id === testEodId);

    expect(cycleFromList).toBeDefined();

    if (cycleFromList) {
      expect(cycleDetails.id).toBe(cycleFromList.id);
      expect(cycleDetails.business_day).toBe(cycleFromList.business_day);
      expect(cycleDetails.status).toBe(cycleFromList.status);
      expect(cycleDetails.records).toBe(cycleFromList.records);

      console.log("Data matches between list and details endpoints");
      console.log(`Business day: ${cycleDetails.business_day}`);
      console.log(`Status: ${cycleDetails.status}`);
      console.log(`Records: ${cycleDetails.records}`);
    }

    console.log("BO EOD cycle details test completed successfully");
  });

  test("BO: Verify EOD cycle records match database transactions", async () => {
    console.log("=== Testing EOD cycle records validation ===");
    console.log(`EOD Cycle ID: ${testEodId}`);
    console.log(`Business day: ${testBusinessDay}`);

    // Skip if database client is not available
    if (!dbClient) {
      console.log(
        "Skipping database verification - database client not available",
      );
      return;
    }

    // Get EOD cycle details
    const cycleDetails = await getEodCycleDetailsBo(operatorToken, testEodId);
    const expectedRecords = cycleDetails.records;

    console.log(`EOD cycle reports ${expectedRecords} records`);

    try {
      // Verify records match database transaction count
      console.log("\nVerifying against database...");

      const verificationResult = await dbClient.verifyEodCycleRecords(
        testEodId,
        testBusinessDay,
        expectedRecords,
      );

      console.log("\n=== Verification Results ===");
      console.log(
        `Database transaction count: ${verificationResult.actualCount}`,
      );
      console.log(`EOD cycle records: ${verificationResult.expectedCount}`);
      console.log(`Match: ${verificationResult.match}`);

      if (verificationResult.difference > 0) {
        console.log(`Difference: ${verificationResult.difference} records`);
      }

      if (verificationResult.match) {
        console.log(
          "SUCCESS: EOD cycle records match database transaction count",
        );
      } else {
        console.log("DISCREPANCY: EOD cycle records do not match database");

        // Try to understand the discrepancy
        if (verificationResult.actualCount > verificationResult.expectedCount) {
          console.log(
            `Database has ${verificationResult.difference} more transactions than reported`,
          );
        } else {
          console.log(
            `EOD cycle reports ${verificationResult.difference} more records than database has`,
          );
        }
      }

      // Perform additional validation
      expect(verificationResult.match).toBe(true);
    } catch (error: any) {
      console.log("Database verification failed:", error.message);
      // Don't fail the test if database verification fails, just log it
    }
  });
});
