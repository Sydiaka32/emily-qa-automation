import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";
import { createAndValidateCct } from "@utils/creditTransferService/creditTransfer/createAndValidateCct";
import { approveCreditTransfer } from "@utils/creditTransferService/creditTransfer/approveCreditTransfer";
import { CreditTransferStatuses } from "../../../../consts/credit-transfer/creditTransferStatuses";
import { CreditTransferTypes } from "../../../../consts/credit-transfer/creditTransferTypes";
import { prepareForExchange } from "@utils/creditTransferService/creditTransfer/prepareForExchange";
import { extractDomesticCurrency } from "@utils/coreService/extractDomesticCurrency";
import { verifyDnsCreditTransferInHistory } from "@utils/creditTransferService/creditTransfer/verifyDnsCreditTransferInHistory";
import { calculateExchangeCtAmountCrypto } from "@utils/creditTransferService/creditTransfer/calculateExchangeCtAmountWithCrypto";
import { getAssets } from "@utils/clearingService/positions/getAssets";

test.describe("Credit Transfer - With Exchange (LCY->Crypto)", () => {
  test("CT with exchange using cryptocurrency", async () => {
    console.log("Starting crypto exchange credit transfer test...");

    // 1. Get tokens and basic data
    const senderToken = await getAccessToken(
      config.indirectMemberName,
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

    // 2. Get all assets to verify crypto type
    const allAssets = await getAssets(operatorToken);

    // 3. Calculate exchange amount with crypto verification
    const { ctAmount, exchangeAsset, availableBalance } =
      await calculateExchangeCtAmountCrypto(
        memberInfo,
        operatorToken,
        senderToken,
        allAssets,
      );

    // 4. Prepare for exchange (currency pair and opposite orders)
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

    // 5. Generate CCT payload with crypto asset
    const cctPayload = createCctPayload({
      domesticCurrency: exchangeAsset, // Use crypto asset instead of domestic currency
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Test Creditor Bank",
      remittanceInformation: "API Test - CCT With Crypto Exchange",
    });

    console.log(
      "Crypto Exchange CCT Payload:",
      JSON.stringify(cctPayload, null, 2),
    );

    // 6. Create and validate CCT
    const { validationId } = await createAndValidateCct(
      cctPayload,
      senderToken,
    );

    // 7. Approve CCT
    const { referenceId } = await approveCreditTransfer(
      validationId,
      senderToken,
    );

    // 8. Verify CCT in sender's history
    const senderTransaction = await verifyDnsCreditTransferInHistory(
      referenceId,
      senderToken,
      {
        ctAmount,
        domesticCurrency: exchangeAsset,
        debtorXmi: config.indirectMemberXmi,
        creditorXmi: config.receiverXmi,
      },
      CreditTransferStatuses.completed,
    );

    // 9. Verify CCT in receiver's history
    const receiverTransaction = await verifyDnsCreditTransferInHistory(
      referenceId,
      receiverToken,
      {
        ctAmount,
        domesticCurrency: exchangeAsset, // Use crypto asset
        debtorXmi: config.indirectMemberXmi,
        creditorXmi: config.receiverXmi,
      },
      CreditTransferStatuses.completed,
    );

    // 10. Final assertions
    expect(senderTransaction.status).toBe(CreditTransferStatuses.completed);
    expect(receiverTransaction.status).toBe(CreditTransferStatuses.completed);

    // Additional assertions specific to crypto exchange
    expect(senderTransaction.type).toBe(CreditTransferTypes.creditTransfer);
    expect(senderTransaction.debtor.xmi).toBe(config.indirectMemberXmi);
    expect(senderTransaction.creditor.xmi).toBe(config.receiverXmi);
    expect(senderTransaction.amount).toBe(ctAmount);
    expect(senderTransaction.currency).toBe(exchangeAsset);

    expect(receiverTransaction.type).toBe(CreditTransferTypes.creditTransfer);
    expect(receiverTransaction.debtor.xmi).toBe(config.indirectMemberXmi);
    expect(receiverTransaction.creditor.xmi).toBe(config.receiverXmi);
    expect(receiverTransaction.amount).toBe(ctAmount);
    expect(receiverTransaction.currency).toBe(exchangeAsset);

    // Final verification summary
    console.log(
      "\n=== CREDIT TRANSFER WITH CRYPTO EXCHANGE TEST COMPLETED SUCCESSFULLY ===",
    );
    console.log("=== Test Summary ===");
    console.log(`Reference ID: ${referenceId}`);
    console.log(`Amount: ${ctAmount} ${exchangeAsset} (via crypto exchange)`);
    console.log(
      `Exchange: ${senderDomesticCurrency} -> ${exchangeAsset} (CRYPTO)`,
    );
    console.log(`Debtor: ${config.indirectMemberXmi}`);
    console.log(`Creditor: ${config.receiverXmi}`);
    console.log(`Sender Status: ${senderTransaction.status}`);
    console.log(`Receiver Status: ${receiverTransaction.status}`);
    console.log("=========================================");

    console.log("Crypto Exchange CT test completed successfully!");
  });
});
