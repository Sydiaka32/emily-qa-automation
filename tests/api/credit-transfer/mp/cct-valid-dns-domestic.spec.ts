import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";
import { createAndValidateCct } from "@utils/creditTransferService/creditTransfer/createAndValidateCct";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { verifyDnsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyDnsCreditTransferInHistory";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";

test.describe("Credit Transfer - DNS in domestic currency", () => {
  test("CT with valid required fields DNS in domestic currency", async () => {
    console.log("Starting CCT test...");

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

    // 2. Calculate CCT amount
    const { ctAmount, domesticCurrency } = await calculateCtAmount(
      memberInfo,
      operatorToken,
      senderToken,
    );

    // 3. Generate CCT payload
    const cctPayload = createCctPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Test Creditor Bank",
      remittanceInformation: "API Test - CCT Domestic Currency",
    });

    console.log("CCT Payload:", JSON.stringify(cctPayload, null, 2));

    // 4. Create and validate CCT
    const { validationId } = await createAndValidateCct(
      cctPayload,
      senderToken,
    );

    // 5. Approve CCT
    const { referenceId } = await approveCreditTransfer(
      validationId,
      senderToken,
    );

    // 6. Verify CCT in sender's history
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

    // 7. Verify CCT in receiver's history
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

    console.log("CCT test completed successfully!");
  });
});
