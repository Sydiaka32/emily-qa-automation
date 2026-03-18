import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateInvalidAmountAboveGcl } from "@utils/creditTransferService/creditTransfer/calculateInvalidAmountAboveGcl";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";
import { createAndVerifyAboveGcl } from "@utils/creditTransferService/creditTransfer/createAndVerifyAboveGcl";
import { getRegionByCode } from "@utils/coreService/regions/getRegionByCode";
import { updateRegion } from "@utils/coreService/regions/updateRegion";
import { buildRegionUpdatePayload } from "@utils/coreService/regions/buildRegionUpdatePayload";

test.describe("Credit Transfer - Invalid Amount Above Global Current Limit", () => {
  let originalRegionDetails: any;
  let regionCode: string;
  let operatorToken: string;

  test.beforeAll(async () => {
    // Get operator token for admin operations
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("CT should fail when amount exceeds global current limit", async () => {
    console.log("Starting CCT invalid amount above GCL test...");

    // 1. Get tokens and basic data for GCL member
    const senderToken = await getAccessToken(
      config.clMemberName,
      config.password,
    );

    const memberInfo = await getCurrentMember(senderToken);
    regionCode = memberInfo.region.code;

    // 2. Get current region details and check if we need to adjust limits
    const regionDetails = await getRegionByCode(regionCode, operatorToken);
    originalRegionDetails = { ...regionDetails };

    const regionalMaxAmount = parseFloat(
      regionDetails.limits.max_transaction_amount_flat,
    );

    // 3. Calculate invalid amount (GCL + 0.01)
    const { invalidAmount, domesticCurrency, globalCurrentLimit } =
      await calculateInvalidAmountAboveGcl(memberInfo, senderToken);

    const testAmount = Number(invalidAmount);

    console.log(
      `Using invalid amount: ${invalidAmount} (above GCL ${globalCurrentLimit})`,
    );
    console.log(`Regional max amount: ${regionalMaxAmount}`);

    // 4. Check if regional limit is lower than our test amount
    if (regionalMaxAmount <= testAmount) {
      console.log(
        "Regional limit is lower than test amount, updating region limits...",
      );

      const newMaxAmount = testAmount + 1000; // Add buffer
      const updatePayload = buildRegionUpdatePayload(
        regionDetails,
        newMaxAmount,
      );

      await updateRegion(regionCode, operatorToken, updatePayload);

      console.log(
        `Updated regional max limit from ${regionalMaxAmount} to ${newMaxAmount}`,
      );
    }

    // 5. Generate CCT payload with invalid amount
    const cctPayload = createCctPayload({
      domesticCurrency,
      ctAmount: invalidAmount,
      memberXmi: config.clMemberXmi,
      receiverXmi: config.receiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Test Creditor Bank",
      remittanceInformation: "API Test - CCT Amount Above GCL",
    });

    console.log(
      "CCT Payload with Invalid Amount:",
      JSON.stringify(cctPayload, null, 2),
    );

    // 6. Attempt to create CCT and verify it fails
    const { status, body } = await createAndVerifyAboveGcl(
      cctPayload,
      senderToken,
      globalCurrentLimit,
    );

    // 7. Verify the error response matches expected GCL error
    expect(status).toBe(400);
    expect(body.code).toBe("fin_validation_error");
    expect(body.message).toContain("Global current limit exceeded");

    // 8. Log success
    console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
    console.log(`CCT correctly rejected amount above GCL`);
    console.log(`Global Current Limit: ${globalCurrentLimit}`);
    console.log(`Used amount: ${invalidAmount}`);
    console.log(`Error status: ${status}`);
    console.log(`Error code: ${body.code}`);
    console.log(`Error message: ${body.message}`);
    console.log("====================================");
  });

  test.afterAll(async () => {
    // Restore original region details if they were modified
    if (originalRegionDetails && regionCode) {
      try {
        console.log("Restoring original region limits...");

        // Build restore payload using original details
        const restorePayload = {
          asset: originalRegionDetails.asset,
          allowed_currencies: originalRegionDetails.allowed_currencies,
          limits: originalRegionDetails.limits,
          name: originalRegionDetails.name,
        };

        await updateRegion(regionCode, operatorToken, restorePayload);

        console.log("Region limits restored successfully");
      } catch (error) {
        console.error("Failed to restore region limits:", error);
      }
    }
  });
});
