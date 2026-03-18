import { test } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateCtAmount } from "@utils/creditTransferService/creditTransfer/calculateCtAmount";
import { createFictPayload } from "@utils/creditTransferService/creditTransfer/createFictPayload";
import { createAndValidateFict } from "@utils/creditTransferService/creditTransfer/createAndValidateFict";
import { verifyDnsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyDnsCreditTransferInHistory";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";

test.describe("FICT - DNS in domestic currency", () => {
  test("FICT with valid required fields DNS in domestic currency", async () => {
    console.log("Starting FICT test...");

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

    // 2. Calculate FICT amount
    const { ctAmount, domesticCurrency } = await calculateCtAmount(
      memberInfo,
      operatorToken,
      senderToken,
    );

    // 3. Generate FICT payload
    const fictPayload = createFictPayload({
      domesticCurrency,
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
    });

    console.log("FICT Payload:", JSON.stringify(fictPayload, null, 2));

    // 4. Create and validate FICT
    const { validationId } = await createAndValidateFict(
      fictPayload,
      senderToken,
    );

    // 5. Approve FICT
    const { referenceId } = await approveCreditTransfer(
      validationId,
      senderToken,
    );

    // 6. Verify FICT in history - waits for COMPLETED status by default
    await verifyDnsCreditTransferInHistory(
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
  });
});
