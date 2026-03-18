import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { createRtgsStpPayload } from "@utils/creditTransferService/creditTransfer/createRtgsStpPayload";
import { createAndValidateRtgsStp } from "@utils/creditTransferService/creditTransfer/createAndValidateRtgsStp";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { verifyRtgsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyRtgsCreditTransferHistory";

test.describe("STP - RTGS in domestic currency", () => {
  test("STP with valid required fields RTGS in domestic currency", async () => {
    console.log("Starting STP RTGS test...");

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

    // 2. Calculate STP RTGS amount
    const { ctAmount, domesticCurrency } = await calculateCtAmount(
      memberInfo,
      operatorToken,
      senderToken,
    );

    // 3. Generate STP RTGS payload
    const stpRtgsPayload = createRtgsStpPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Test Creditor Bank",
      remittanceInformation: "API Test - STP RTGS Domestic Currency",
    });

    console.log("STP RTGS Payload:", JSON.stringify(stpRtgsPayload, null, 2));

    // 4. Create and validate STP RTGS
    const { validationId } = await createAndValidateRtgsStp(
      stpRtgsPayload,
      senderToken,
    );

    // 5. Approve STP RTGS
    const { referenceId } = await approveCreditTransfer(
      validationId,
      senderToken,
    );

    // 6. Verify STP RTGS in sender's history
    const senderTransaction = await verifyRtgsCreditTransferInHistory(
      referenceId,
      senderToken,
      {
        ctAmount,
        domesticCurrency,
        debtorXmi: config.memberXmi,
        creditorXmi: config.receiverXmi,
      },
      CreditTransferStatuses.settled,
    );

    // 7. Verify STP RTGS in receiver's history
    const receiverTransaction = await verifyRtgsCreditTransferInHistory(
      referenceId,
      receiverToken,
      {
        ctAmount,
        domesticCurrency,
        debtorXmi: config.memberXmi,
        creditorXmi: config.receiverXmi,
      },
      CreditTransferStatuses.settled,
    );

    // 8. Final assertions
    expect(senderTransaction.status).toBe(CreditTransferStatuses.settled);
    expect(receiverTransaction.status).toBe(CreditTransferStatuses.settled);

    console.log("STP RTGS test completed successfully!");
  });
});
