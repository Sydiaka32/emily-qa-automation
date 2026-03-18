import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateInvalidAmountAboveMax } from "@utils/creditTransferService/creditTransfer/calculateInvalidAmountAboveMax";
import { createAndVerifyAboveMax } from "@utils/creditTransferService/creditTransfer/createAndVerifyAboveMax";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";

test.describe("Credit Transfer - Invalid Amount Above Regional Maximum", () => {
  test("CT should fail when amount is above regional maximum limit", async () => {
    console.log("Starting CCT invalid amount above maximum test...");

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

    // 2. Calculate invalid amount (max_regional_amount + 0.01)
    const { invalidAmount, domesticCurrency, maxRegionalLimit } =
      await calculateInvalidAmountAboveMax(memberInfo, operatorToken);

    console.log(
      `Using invalid amount: ${invalidAmount} (above maximum ${maxRegionalLimit})`,
    );

    // 3. Generate CCT payload with invalid amount
    const cctPayload = createCctPayload({
      domesticCurrency,
      ctAmount: invalidAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Test Creditor Bank",
      remittanceInformation: "API Test - CCT Amount Above Maximum",
    });

    console.log(
      "CCT Payload with Invalid Amount:",
      JSON.stringify(cctPayload, null, 2),
    );

    // 4. Attempt to create CCT and verify it fails
    const { status, body } = await createAndVerifyAboveMax(
      cctPayload,
      senderToken,
      maxRegionalLimit,
    );

    // 5. Additional specific assertions
    expect(status).toBe(400);
    expect(body.code).toBe("fin_validation_error");
    expect(body.message).toContain(
      "Fin validation error: Debit amount exceeds the allowed maximum",
    );

    // 6. Log success
    console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
    console.log(`CCT correctly rejected amount above maximum`);
    console.log(`Regional maximum: ${maxRegionalLimit}`);
    console.log(`Used amount: ${invalidAmount}`);
    console.log(`Error status: ${status}`);
    console.log(`Error code: ${body.code}`);
    console.log(`Error message: ${body.message}`);
    console.log("====================================");
  });
});
