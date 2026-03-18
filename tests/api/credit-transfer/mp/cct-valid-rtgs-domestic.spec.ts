import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { createRtgsCctPayload } from "@utils/creditTransferService/creditTransfer/createRtgsCctPayload";
import { createAndValidateRtgsCct } from "@utils/creditTransferService/creditTransfer/createAndValidateRtgsCct";
import { verifyRtgsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyRtgsCreditTransferHistory";

test.describe("Credit Transfer - RTGS in domestic currency", () => {
  test("CT with valid required fields RTGS in domestic currency", async () => {
    console.log("Starting RTGS test...");

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

    // 2. Calculate RTGS amount
    const { ctAmount, domesticCurrency } = await calculateCtAmount(
      memberInfo,
      operatorToken,
      senderToken,
    );

    // 3. Generate RTGS payload
    const rtgsPayload = createRtgsCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Test Creditor Bank",
      remittanceInformation: "API Test - RTGS Domestic Currency",
    });

    console.log("RTGS Payload:", JSON.stringify(rtgsPayload, null, 2));

    // 4. Create and validate RTGS
    const { validationId } = await createAndValidateRtgsCct(
      rtgsPayload,
      senderToken,
    );

    // 5. Approve RTGS
    const { referenceId } = await approveCreditTransfer(
      validationId,
      senderToken,
    );

    // 6. Verify RTGS in sender's history
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

    // 7. Verify RTGS in receiver's history
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

    console.log("RTGS test completed successfully!");
  });
});
