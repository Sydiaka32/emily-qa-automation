import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { createStpPayload } from "@utils/creditTransferService/creditTransfer/createStpPayload";
import { createAndValidateStp } from "@utils/creditTransferService/creditTransfer/createAndValidateStp";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { verifyDnsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyDnsCreditTransferInHistory";

test.describe("STP - DNS in domestic currency", () => {
  test("STP with valid required fields DNS in domestic currency", async () => {
    console.log("Starting STP test...");

    // 1. Get tokens and basic data
    const senderToken = await getAccessToken(
      config.memberName,
      config.password,
    );
    const operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
    const receiverToken = await getAccessToken(
      config.receiverName,
      config.password,
    );

    const memberInfo = await getCurrentMember(senderToken);

    // 2. Calculate STP amount
    const { ctAmount, domesticCurrency } = await calculateCtAmount(
      memberInfo,
      operatorToken,
      senderToken,
    );

    // 3. Generate STP payload
    const stpPayload = createStpPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Test Creditor Bank",
      remittanceInformation: "API Test - STP Domestic Currency",
    });

    console.log("STP Payload:", JSON.stringify(stpPayload, null, 2));

    // 4. Create and validate STP
    const { validationId } = await createAndValidateStp(
      stpPayload,
      senderToken,
    );

    // 5. Approve STP
    const { referenceId } = await approveCreditTransfer(
      validationId,
      senderToken,
    );

    // 6. Verify STP in sender's history
    const senderTransaction = await verifyDnsCreditTransferInHistory(
      referenceId,
      senderToken,
      {
        ctAmount,
        domesticCurrency,
        debtorXmi: config.memberXmi,
        creditorXmi: config.receiverXmi,
      },
      CreditTransferStatuses.completed,
    );

    // 7. Verify STP in receiver's history
    const receiverTransaction = await verifyDnsCreditTransferInHistory(
      referenceId,
      receiverToken,
      {
        ctAmount,
        domesticCurrency,
        debtorXmi: config.memberXmi,
        creditorXmi: config.receiverXmi,
      },
      CreditTransferStatuses.completed,
    );

    // 8. Final assertions
    expect(senderTransaction.status).toBe(CreditTransferStatuses.completed);
    expect(receiverTransaction.status).toBe(CreditTransferStatuses.completed);

    console.log("STP test completed successfully!");
  });
});
