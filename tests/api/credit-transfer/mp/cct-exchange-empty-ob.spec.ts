import { test, expect } from "@playwright/test";
import { config } from "../../../../test.config";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { getCurrentMember } from "@utils/coreService/members/getCurrentMember";
import { calculateExchangeCtAmount } from "@utils/creditTransferService/creditTransfer/calculateExchangeCtAmount";
import { createCctPayload } from "@utils/creditTransferService/creditTransfer/createCctPayload";
import { extractDomesticCurrency } from "@utils/coreService/extractDomesticCurrency";
import { currencyPairRecreation } from "@utils/exchangeService/settings/currencyPairRecreation";
import { createAndValidateCctEmptyOrderBook } from "@utils/creditTransferService/creditTransfer/createAndValidateCctEmptyOb";

test.describe("Credit Transfer - With Exchange (Empty Order Book)", () => {
  let senderToken: string;
  let operatorToken: string;
  let memberInfo: any;
  let domesticCurrency: string;
  let exchangeAsset: string;
  let ctAmount: number;

  test.beforeAll(async () => {
    console.log("Setting up test environment for empty order book exchange...");

    // 1. Get tokens and basic data
    senderToken = await getAccessToken(config.memberName, config.password);
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );

    memberInfo = await getCurrentMember(senderToken);
    domesticCurrency = extractDomesticCurrency(memberInfo);

    // 2. Calculate exchange amount (amount > available balance to trigger exchange)
    const exchangeData = await calculateExchangeCtAmount(
      memberInfo,
      operatorToken,
      senderToken,
    );
    ctAmount = exchangeData.ctAmount;
    exchangeAsset = exchangeData.exchangeAsset;

    console.log(`Domestic currency: ${domesticCurrency}`);
    console.log(`Exchange asset: ${exchangeAsset}`);
    console.log(`CT amount: ${ctAmount}`);

    // 3. Clear the order book by recreating the currency pair
    // This ensures no orders exist for the conversion
    console.log("Clearing order book by recreating currency pair...");
    await currencyPairRecreation(
      domesticCurrency,
      exchangeAsset,
      operatorToken,
      senderToken,
    );

    console.log("Order book cleared successfully - ready for test");
  });

  test("CT with exchange should fail when order book is empty", async () => {
    console.log("Starting exchange CT with empty order book test...");

    // 4. Generate CCT payload with exchange asset
    const cctPayload = createCctPayload({
      domesticCurrency: exchangeAsset, // Use exchange asset instead of domestic currency
      ctAmount,
      memberXmi: config.memberXmi,
      receiverXmi: config.receiverXmi,
      debtorName: "Test Debtor Bank",
      creditorName: "Test Creditor Bank",
      remittanceInformation: "API Test - CCT With Empty Order Book",
    });

    console.log("Exchange CCT Payload:", JSON.stringify(cctPayload, null, 2));

    // 5. Attempt to create CCT - this should fail due to empty order book
    const { status, body } = await createAndValidateCctEmptyOrderBook(
      cctPayload,
      senderToken,
    );

    // 6. Verify the error response
    console.log("Error Response Body:", JSON.stringify(body, null, 2));

    // Verify error status and structure
    expect(status).toBe(400);
    expect(body).toBeDefined();
    expect(body.code).toBe("fin_validation_error");
    expect(body.message).toContain("Currency conversion unavailable");
    expect(body.message).toContain(domesticCurrency);
    expect(body.message).toContain(exchangeAsset);

    // 7. Log test completion
    console.log(
      "\n=== EXCHANGE CT WITH EMPTY ORDER BOOK TEST COMPLETED SUCCESSFULLY ===",
    );
    console.log("=== Test Summary ===");
    console.log(
      `Expected Error: Currency conversion unavailable for ${domesticCurrency} to ${exchangeAsset}`,
    );
    console.log(`CT Amount: ${ctAmount} ${exchangeAsset}`);
    console.log(`Debtor: ${config.memberXmi}`);
    console.log(`Creditor: ${config.receiverXmi}`);
    console.log("=========================================");
  });
});
