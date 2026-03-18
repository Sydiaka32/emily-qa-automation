import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { verifyDnsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyDnsCreditTransferInHistory";
import { cancelCreditTransfer } from "@utils/creditTransferService/creditTransfer/cancelCreditTransfer";
import { PendingCTData } from "../../../../modules/creditTransfer/pendingCtData";
import { createPendingCT } from "@utils/creditTransferService/creditTransfer/createPendingCt";

test.describe("Credit Transfer - Cancel Pending CT", () => {
  let pendingCTData: PendingCTData;

  test.beforeAll(async () => {
    console.log("Setting up pending CT for cancellation test...");

    // Create a pending CT that we'll use in our test
    pendingCTData = await createPendingCT("API Test - CCT Cancel Pending");

    // The verification is already done inside createPendingCT
    console.log("Pending CT setup completed successfully");
  });

  test("Cancel CT in Pending status", async () => {
    console.log("Starting Cancel Pending CT test...");

    const { referenceId, ctAmount, domesticCurrency, senderToken } =
      pendingCTData;

    // 1. Cancel the CT
    console.log(`Cancelling CT with referenceId: ${referenceId}`);
    const cancelResponse = await cancelCreditTransfer(referenceId, senderToken);

    expect(cancelResponse.status).toBe(200);
    console.log("CT cancelled successfully");

    // 2. Verify CT status changed to CANCELLED
    const cancelledTransaction = await verifyDnsCreditTransferInHistory(
      referenceId,
      senderToken,
      {
        ctAmount,
        domesticCurrency,
        debtorXmi: config.memberXmi,
        creditorXmi: config.receiverXmi,
      },
      CreditTransferStatuses.cancelled,
    );

    expect(cancelledTransaction.status).toBe(CreditTransferStatuses.cancelled);

    console.log("Cancel Pending CT test completed successfully!");
    console.log(`Final CT status: ${cancelledTransaction.status}`);
  });
});
