import { test, expect } from "@playwright/test";
import { generateBizMsgEnvlp } from "@utils/messagingService/generateBizMsgEnvlp";
import { sendIsoMessage } from "@utils/messagingService/sendIsoMessage";
import { config } from "../../../../test.config";
import { CreditTransferData } from "../../../../modules/creditTransfer/creditTransferData";
import { getCreditTransferData } from "@utils/creditTransferService/creditTransfer/getCreditTransferData";
import { getAccessToken } from "@utils/auth";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { waitForMessage } from "@utils/messagingService/waitForMeesage";
import { waitForCreditTransfer } from "@utils/creditTransferService/creditTransfer/waitForCreditTransfer";
import { MessageStatus } from "../../../../consts/messaging/messageStatus";

test.describe("PACS.008 Valid Message", () => {
  let creditTransferData: CreditTransferData;
  const senderMemberXmi = config.senderMemberIso;
  const receiverMemberXmi = config.receiverClearingIso;
  const instgAgtId = config.senderMemberIso;
  const instdAgtId = config.receiverMemberIso;
  const dbtrAgentId = config.receiverMemberIso;
  const restApiUrl = config.publicBaseUrl;
  const apiKey = config.publicApiKey;
  const apiBaseUrl = config.apiBaseUrl;

  test.beforeAll(async () => {
    console.log("Setting up credit transfer data...");
    creditTransferData = await getCreditTransferData({
      makerName: config.makerName,
      memberName: config.memberName,
      password: config.password,
      receiverName: config.receiverName,
      operatorName: config.operatorName,
      memberXmi: config.senderMemberIso,
      receiverXmi: config.receiverMemberIso,
    });
    console.log("Credit transfer data setup complete");
  });

  test("should send valid PACS.008 message and receive ACKED status", async ({
    request,
  }) => {
    // Configuration for ISO message
    const isoConfig = {
      appHdr: {
        senderMemberXmi: senderMemberXmi,
        receiverMemberXmi: receiverMemberXmi,
      },
      document: {
        intrBkSttlmAmt: creditTransferData.ctAmount.toString(),
        instgAgtId: instgAgtId,
        instdAgtId: instdAgtId,
        dbtrAgentId: dbtrAgentId,
      },
    };

    // Generate ISO message
    const isoMessage = generateBizMsgEnvlp(isoConfig);

    // Extract TxId from the generated XML for later verification
    const txIdMatch = isoMessage.match(/<TxId>(.*?)<\/TxId>/);
    if (!txIdMatch) {
      throw new Error("TxId not found in generated XML");
    }
    const txId = txIdMatch[1];
    console.log(`Extracted TxId for verification: ${txId}`);

    // Send ISO message
    const response = await sendIsoMessage({
      request,
      restApiUrl: restApiUrl,
      apiKey: apiKey,
      xmlMessage: isoMessage,
    });

    // Verify response status
    expect(response.status).toBe(200);

    // Parse XML response and verify status is ACKED
    const responseText = response.body;
    expect(responseText).toContain("<Status>ACKED</Status>");

    console.log("ISO Message sent successfully with ACKED status");

    // Get tokens for sender and receiver
    const senderToken = await getAccessToken(
      config.memberName,
      config.password,
    );
    const receiverToken = await getAccessToken(
      config.receiverName,
      config.password,
    );

    // Wait for message to appear in sender's messages
    // From sender's perspective: sender -> clearing system
    console.log("Waiting for message in sender's messages...");
    const senderPacs008 = await waitForMessage({
      request,
      apiBaseUrl,
      accessToken: senderToken,
      search: txId,
      expectedSenderXmi: senderMemberXmi,
      expectedReceiverXmi: receiverMemberXmi,
      maxAttempts: 25,
      delayMs: 500,
    });

    expect(senderPacs008.tx_id).toBe(txId);
    expect(senderPacs008.status).toBe(MessageStatus.completed);
    console.log("PACS.008 message found in sender's messages");

    // Wait for message to appear in receiver's messages
    // From receiver's perspective: clearing system -> receiver member
    console.log("Waiting for message in receiver's messages...");
    const receiverPacs008 = await waitForMessage({
      request,
      apiBaseUrl,
      accessToken: receiverToken,
      search: txId,
      expectedSenderXmi: receiverMemberXmi,
      expectedReceiverXmi: instdAgtId,
      maxAttempts: 25,
      delayMs: 500,
    });

    expect(receiverPacs008.tx_id).toBe(txId);
    expect(receiverPacs008.status).toBe(MessageStatus.completed);
    console.log("PACS.008 message found in receiver's messages");

    // Wait for credit transfer to be created and completed
    console.log("Waiting for credit transfer to be created...");
    const creditTransfer = await waitForCreditTransfer({
      request,
      apiBaseUrl,
      accessToken: senderToken,
      search: txId,
      expectedStatus: CreditTransferStatuses.completed,
      maxAttempts: 25,
      delayMs: 500,
    });

    // Verify credit transfer details
    expect(creditTransfer.tx_id).toBe(txId);
    expect(creditTransfer.status).toBe(CreditTransferStatuses.completed);
    expect(creditTransfer.amount).toBe(creditTransferData.ctAmount);
    expect(creditTransfer.debtor.xmi).toBe(senderMemberXmi);
    expect(creditTransfer.creditor.xmi).toBe(instdAgtId);
    console.log("Credit transfer created and completed successfully");

    console.log("All verifications passed!");
  });
});
