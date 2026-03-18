import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateExchangeCtAmount } from "@utils/creditTransferService/creditTransfer/calculateExchangeCtAmount";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";
import { createAndValidateCct } from "@utils/creditTransferService/creditTransfer/createAndValidateCct";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { CreditTransferTypes } from "../../../../consts/credit-transfer/creditTransferTypes";
import { prepareForExchange } from "@utils/creditTransferService/creditTransfer/prepareForExchange";
import { extractDomesticCurrency } from "@utils/coreService/extractDomesticCurrency";
import { verifyDnsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyDnsCreditTransferInHistory";

test.describe("Credit Transfer - With Exchange (LCY->LCY)", () => {
  test("CT with exchange using non-domestic currency", async () => {
    console.log("Starting exchange credit transfer test...");

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
    const makerToken = await getAccessToken(config.makerName, config.password);

    const memberInfo = await getCurrentMember(senderToken);
    const senderDomesticCurrency = extractDomesticCurrency(memberInfo);

    // 2. Calculate exchange amount (amount > available balance to trigger exchange)
    const { ctAmount, exchangeAsset, availableBalance } =
      await calculateExchangeCtAmount(memberInfo, operatorToken, senderToken);

    // 3. Prepare for exchange (currency pair and opposite orders)
    console.log("Preparing for exchange...");
    await prepareForExchange({
      memberInfo,
      operatorToken,
      senderToken,
      makerToken,
      exchangeAsset,
      ctAmount,
      availableBalance,
      senderDomesticCurrency,
    });

    // 4. Generate CCT payload with exchange asset
    const cctPayload = createCctPayload({
      domesticCurrency: exchangeAsset, // Use exchange asset instead of domestic currency
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Test Creditor Bank",
      remittanceInformation: "API Test - CCT With Exchange",
    });

    console.log("Exchange CCT Payload:", JSON.stringify(cctPayload, null, 2));

    // 5. Create and validate CCT
    const { validationId } = await createAndValidateCct(
      cctPayload,
      senderToken,
    );

    // 6. Approve CCT
    const { referenceId } = await approveCreditTransfer(
      validationId,
      senderToken,
    );

    // 7. Verify CCT in sender's history
    const senderTransaction = await verifyDnsCreditTransferInHistory(
      referenceId,
      senderToken,
      {
        ctAmount,
        domesticCurrency: exchangeAsset,
        debtorXmi: config.memberXmi,
        creditorXmi: config.receiverXmi,
      },
      CreditTransferStatuses.completed,
    );

    // 8. Verify CCT in receiver's history
    const receiverTransaction = await verifyDnsCreditTransferInHistory(
      referenceId,
      receiverToken,
      {
        ctAmount,
        domesticCurrency: exchangeAsset, // Use exchange asset
        debtorXmi: config.memberXmi,
        creditorXmi: config.receiverXmi,
      },
      CreditTransferStatuses.completed,
    );

    // 9. Final assertions
    expect(senderTransaction.status).toBe(CreditTransferStatuses.completed);
    expect(receiverTransaction.status).toBe(CreditTransferStatuses.completed);

    // Additional assertions specific to exchange
    expect(senderTransaction.type).toBe(CreditTransferTypes.creditTransfer);
    expect(senderTransaction.debtor.xmi).toBe(config.memberXmi);
    expect(senderTransaction.creditor.xmi).toBe(config.receiverXmi);
    expect(senderTransaction.amount).toBe(ctAmount);
    expect(senderTransaction.currency).toBe(exchangeAsset);

    expect(receiverTransaction.type).toBe(CreditTransferTypes.creditTransfer);
    expect(receiverTransaction.debtor.xmi).toBe(config.memberXmi);
    expect(receiverTransaction.creditor.xmi).toBe(config.receiverXmi);
    expect(receiverTransaction.amount).toBe(ctAmount);
    expect(receiverTransaction.currency).toBe(exchangeAsset);

    // Final verification summary
    console.log(
      "\n=== CREDIT TRANSFER WITH EXCHANGE TEST COMPLETED SUCCESSFULLY ===",
    );
    console.log("=== Test Summary ===");
    console.log(`Reference ID: ${referenceId}`);
    console.log(`Amount: ${ctAmount} ${exchangeAsset} (via exchange)`);
    console.log(`Exchange: ${senderDomesticCurrency} -> ${exchangeAsset}`);
    console.log(`Debtor: ${config.memberXmi}`);
    console.log(`Creditor: ${config.receiverXmi}`);
    console.log(`Sender Status: ${senderTransaction.status}`);
    console.log(`Receiver Status: ${receiverTransaction.status}`);
    console.log("=========================================");

    console.log("Exchange CT test completed successfully!");
  });
});
