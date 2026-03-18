import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getOperatorToken } from "@utils/auth";
import { getMemberPositionDetailsBo } from "@utils/clearingService/positions/bo/getMemberPositionDetailsBo";
import { findMemberWithPositions } from "@utils/clearingService/positions/bo/findMemberWithPositions";
import { verifyPositionDetails } from "@utils/clearingService/positions/bo/verifyPositionDetails";
import { MemberPositionDetails } from "../../../../modules/clearing/memberPositionDetail";

test.describe("BackOffice - Member Position Details", () => {
  let operatorToken: string;
  let testXmi: string = "";
  let testMemberName: string = "";

  test.beforeAll(async () => {
    // Get operator token for BO operations
    console.log("Getting operator token...");
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    console.log("Operator token obtained");

    // Find a member with positions
    console.log("\nFinding a member with positions...");
    const result = await findMemberWithPositions(operatorToken);
    testXmi = result.xmi;
    testMemberName = result.name;
    console.log(`Selected member: ${testXmi} (${testMemberName})`);
  });

  test("BO: Get position details for a member", async () => {
    console.log("\n=== Testing member position details retrieval ===");
    console.log(`Member: ${testXmi} (${testMemberName})`);

    // Get position details
    const positions = await getMemberPositionDetailsBo(operatorToken, testXmi);

    // Verify the response
    verifyPositionDetails(positions, testXmi);

    // Additional validations
    console.log("\n=== Additional Validations ===");

    // Check for different settlement types
    const settlementTypes = positions.map((p) => p.settlement_type);
    const uniqueTypes = [...new Set(settlementTypes)];
    console.log(
      `Found ${uniqueTypes.length} settlement types: ${uniqueTypes.join(", ")}`,
    );

    // Check account numbers format
    positions.forEach((position) => {
      expect(position.account_number).toMatch(
        /^XMBER\d+[A-Z]{4}_CLR_[RM]_[A-Z]+_NON$/,
      );
    });
    console.log(`All account numbers follow expected format`);

    console.log("\nPosition details test completed successfully!");
  });

  test("BO: Verify position details structure", async () => {
    console.log("\n=== Testing complete position details structure ===");

    const positions = await getMemberPositionDetailsBo(operatorToken, testXmi);

    console.log(`Analyzing ${positions.length} positions for ${testXmi}:`);

    // Group by settlement type for analysis
    const positionsByType: Record<string, MemberPositionDetails[]> = {};
    positions.forEach((position) => {
      const type = position.settlement_type;
      if (!positionsByType[type]) {
        positionsByType[type] = [];
      }
      positionsByType[type].push(position);
    });

    console.log("\n=== Position Analysis by Type ===");
    Object.entries(positionsByType).forEach(([type, typePositions]) => {
      console.log(`\n${type} positions (${typePositions.length}):`);

      // Analyze deposit/withdrawal addresses
      const withDeposit = typePositions.filter(
        (p) => p.deposit_address !== null,
      ).length;
      const withWithdrawal = typePositions.filter(
        (p) => p.withdrawal_address !== null,
      ).length;

      console.log(`  - With deposit address: ${withDeposit}`);
      console.log(`  - With withdrawal address: ${withWithdrawal}`);

      // Amount analysis
      const totalClr = typePositions.reduce((sum, p) => sum + p.clr_amount, 0);
      const totalReserved = typePositions.reduce(
        (sum, p) => sum + p.reserved,
        0,
      );
      const totalSet = typePositions.reduce((sum, p) => sum + p.set_amount, 0);

      console.log(`  - Total CLR: ${totalClr.toFixed(2)}`);
      console.log(`  - Total Reserved: ${totalReserved.toFixed(2)}`);
      console.log(`  - Total SET: ${totalSet.toFixed(2)}`);
    });

    // Detailed validation of first few positions
    console.log("\n=== Detailed Validation of Sample Positions ===");
    const samplePositions = positions.slice(0, Math.min(3, positions.length));

    samplePositions.forEach((position, index) => {
      console.log(`\nSample ${index + 1}: ${position.code}`);
      console.log(`  Account: ${position.account_number}`);
      console.log(`  CLR Amount: ${position.clr_amount}`);
      console.log(`  Reserved: ${position.reserved}`);
      console.log(`  SET Amount: ${position.set_amount}`);
      console.log(`  Cash Amount: ${position.cash_amount}`);
      console.log(`  Deposit: ${position.deposit_address || "null"}`);
      console.log(`  Withdrawal: ${position.withdrawal_address || "null"}`);
    });

    console.log("\nPosition structure analysis completed");
  });
});
