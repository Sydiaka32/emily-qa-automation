import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";
import { getRestrictions } from "@utils/creditTransferService/restrictions/getRestrictions";
import { createAndVerifyRestrictedMember } from "@utils/creditTransferService/restrictions/createAndVerifyRestrictedMember";

test.describe("Credit Transfer - Restricted Member", () => {
  let senderToken: string;
  let operatorToken: string;
  let memberInfo: any;
  let ctAmount: number;
  let domesticCurrency: string;

  test.beforeAll(async () => {
    console.log("Setting up test environment for restricted member tests...");

    // Get tokens and member info
    senderToken = await getAccessToken(config.memberName, config.password);
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    memberInfo = await getCurrentMember(senderToken);

    // Calculate dynamic CCT amount that respects business rules
    const amountData = await calculateCtAmount(
      memberInfo,
      operatorToken,
      senderToken,
    );
    ctAmount = amountData.ctAmount;
    domesticCurrency = amountData.domesticCurrency;

    console.log(
      `Test setup completed. Using dynamic amount: ${ctAmount} ${domesticCurrency}`,
    );
  });

  test("CT to a restricted member should fail with tech_validation_error", async () => {
    console.log("Testing CT to a restricted member...");

    // First, get restrictions to find a restricted member
    const { body: restrictions } = await getRestrictions(senderToken, 0, 10);

    if (restrictions.content.length === 0) {
      console.log("No restrictions found in the system. Test cannot proceed.");
      // Mark test as skipped or pass with a note
      return;
    }

    // Take the first restriction found
    const restriction = restrictions.content[0];
    const currentMemberXmi = config.memberXmi;

    // Determine which member to use as receiver
    let restrictedReceiverXmi: string;

    if (restriction.blocker.xmi === currentMemberXmi) {
      // Current member is blocker, use blocked member as receiver
      restrictedReceiverXmi = restriction.blocked.xmi;
      console.log(
        `Current member ${currentMemberXmi} blocks ${restrictedReceiverXmi}`,
      );
    } else if (restriction.blocked.xmi === currentMemberXmi) {
      // Current member is blocked, use blocker member as receiver
      restrictedReceiverXmi = restriction.blocker.xmi;
      console.log(
        `Current member ${currentMemberXmi} is blocked by ${restrictedReceiverXmi}`,
      );
    } else {
      // Use blocked member as receiver (arbitrary choice for test)
      restrictedReceiverXmi = restriction.blocked.xmi;
      console.log(`Using blocked member ${restrictedReceiverXmi} as receiver`);
    }

    // Create CCT payload with restricted receiver
    const payload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: currentMemberXmi,
      receiverXmi: restrictedReceiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Restricted Creditor Bank",
      remittanceInformation: "API Test - CCT to Restricted Member",
    });

    console.log(
      "CT Payload for Restricted Member:",
      JSON.stringify(payload, null, 2),
    );

    // Attempt to create CCT
    const { status, body } = await createAndVerifyRestrictedMember(
      payload,
      senderToken,
    );

    // Check for specific restriction error
    expect(status).toBe(400);
    expect(body.code).toBe("tech_validation_error");
    expect(body.message).toContain("Blocked");

    console.log("CT to restricted member correctly failed validation");
    console.log(`Error code: ${body.code}`);
    console.log(`Error message: ${body.message}`);
    console.log(`Restriction reason: ${restriction.reason_code}`);
  });
});
