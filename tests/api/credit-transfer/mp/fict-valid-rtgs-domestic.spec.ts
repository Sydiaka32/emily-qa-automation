import { test } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { createRtgsFictPayload } from "@utils/creditTransferService/creditTransfer/createRtgsFictPayload";
import { createAndValidateRtgsFict } from "@utils/creditTransferService/creditTransfer/createAndValidateRtgsFict";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { verifyRtgsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyRtgsCreditTransferHistory";

test.describe("FICT - RTGS in domestic currency", () => {
  test("FICT with valid required fields RTGS in domestic currency", async () => {
    console.log("Starting FICT RTGS test...");

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

    // 2. Calculate FICT RTGS amount
    const { ctAmount, domesticCurrency } = await calculateCtAmount(
      memberInfo,
      operatorToken,
      senderToken,
    );

    // 3. Generate FICT RTGS payload
    const fictRtgsPayload = createRtgsFictPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    console.log("FICT RTGS Payload:", JSON.stringify(fictRtgsPayload, null, 2));

    // 4. Create and validate FICT RTGS
    const { validationId } = await createAndValidateRtgsFict(
      fictRtgsPayload,
      senderToken,
    );

    // 5. Approve FICT RTGS
    const { referenceId } = await approveCreditTransfer(
      validationId,
      senderToken,
    );

    // 6. Verify FICT RTGS in history - wait for SETTLED status
    await verifyRtgsCreditTransferInHistory(
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

    console.log("FICT RTGS test completed successfully!");
  });
});
