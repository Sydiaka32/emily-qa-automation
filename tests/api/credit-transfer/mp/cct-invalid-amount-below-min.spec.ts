import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateInvalidAmountBelowMin } from "@utils/creditTransferService/creditTransfer/calculateInvalidAmountBelowMin";
import { createAndVerifyBelowMin } from "@utils/creditTransferService/creditTransfer/createAndVerifyBelowMin";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";

test.describe("Credit Transfer - Invalid Amount Below Regional Minimum", () => {
  test("CT should fail when amount is below regional minimum limit", async () => {
    console.log("Starting CCT invalid amount test...");

    // 1. Get tokens and basic data
    const senderToken = await getAccessToken(
      config.memberName,
      config.password,
    );
    const operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    const memberInfo = await getCurrentMember(senderToken);

    // 2. Calculate invalid amount (min_regional_amount - 0.01)
    const { invalidAmount, domesticCurrency, minRegionalLimit } =
      await calculateInvalidAmountBelowMin(memberInfo, operatorToken);

    console.log(
      `Using invalid amount: ${invalidAmount} (below minimum ${minRegionalLimit})`,
    );

    // 3. Generate CCT payload with invalid amount
    const cctPayload = createCctPayload({
      domesticCurrency,
      ctAmount: invalidAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Test Creditor Bank",
      remittanceInformation: "API Test - CCT Amount Below Minimum",
    });

    console.log(
      "CCT Payload with Invalid Amount:",
      JSON.stringify(cctPayload, null, 2),
    );

    // 4. Attempt to create CCT and verify it fails
    const { status, body } = await createAndVerifyBelowMin(
      cctPayload,
      senderToken,
      minRegionalLimit,
    );

    // 5. Additional specific assertions
    expect(status).toBe(400);
    expect(body.code).toBe("field_error");
    expect(body.message).toContain("Input validation error");

    // 6. Log success
    console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
    console.log(`✓ CCT correctly rejected amount below minimum`);
    console.log(`✓ Regional minimum: ${minRegionalLimit}`);
    console.log(`✓ Used amount: ${invalidAmount}`);
    console.log(`✓ Error status: ${status}`);
    console.log(`✓ Error code: ${body.code}`);
    console.log(`✓ Error message: ${body.message}`);
    console.log("====================================");
  });
});
