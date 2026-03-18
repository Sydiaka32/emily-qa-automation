import { currencyPairRecreation } from "../../exchangeService/settings/currencyPairRecreation";
import { createOppositeGTCOrder } from "../../exchangeService/order/createOppositeGtcOrder";
import { waitForOrderToBeActive } from "../../exchangeService/order/waitOrderToBeActive";
import { getExchangeRate } from "@utils/exchangeService/getExchangeRate";

export async function prepareForExchange(options: {
  memberInfo: any;
  operatorToken: string;
  senderToken: string;
  makerToken: string;
  exchangeAsset: string;
  ctAmount: number;
  availableBalance: number;
  senderDomesticCurrency: string;
}): Promise<void> {
  const {
    operatorToken,
    senderToken,
    makerToken,
    exchangeAsset,
    ctAmount,
    availableBalance,
    senderDomesticCurrency,
  } = options;

  console.log("Preparing exchange environment...");

  // Get current exchange rate to convert BTC amount to SAR
  console.log("Getting current exchange rate for conversion...");
  const exchangeRate = await getExchangeRate(
    operatorToken,
    exchangeAsset, // BTC
    senderDomesticCurrency, // SAR
    "REUTERS",
  );

  console.log(
    `Current exchange rate: 1 ${exchangeAsset} = ${exchangeRate} ${senderDomesticCurrency}`,
  );

  // Convert BTC amount to SAR amount
  const sarAmount = (ctAmount - availableBalance) * exchangeRate;

  // Round to 2 decimal places for SAR
  const roundedSarAmount = Math.round(sarAmount * 100) / 100;

  console.log(
    `Converted amount: ${ctAmount - availableBalance} ${exchangeAsset} = ${roundedSarAmount} ${senderDomesticCurrency}`,
  );

  // Ensure currency pair exists for exchange
  console.log("Ensuring currency pair exists for exchange...");
  await currencyPairRecreation(
    senderDomesticCurrency, // SAR (base)
    exchangeAsset, // BTC (quote)
    operatorToken,
    senderToken,
  );

  // Create opposite limit order to provide liquidity for expected Market FOK
  console.log("Creating opposite limit order for exchange liquidity...");

  const expectedSystemOrder = {
    constraint: "FOK",
    left_currency: senderDomesticCurrency, // SAR (base)
    right_currency: exchangeAsset, // BTC (quote)
    quantity: roundedSarAmount, // Amount of SAR to sell (converted from BTC)
    direction: "ASK", // Selling SAR, buying BTC
    order_type: "MARKET",
  };

  console.log(
    `Using ${senderDomesticCurrency}/${exchangeAsset} pair - system will create ASK to sell ${senderDomesticCurrency} and buy ${exchangeAsset}:`,
    JSON.stringify(expectedSystemOrder, null, 2),
  );

  // Create opposite BID order (buying SAR, selling BTC) to provide liquidity
  // Pass the exchange rate so the opposite order can calculate the correct price
  const limitOrderOuid = await createOppositeGTCOrder(
    expectedSystemOrder,
    makerToken,
    exchangeRate, // Pass the actual exchange rate
  );

  // Wait for limit order to be active - use maker token to check the order status
  console.log("Waiting for limit order to be active...");
  await waitForOrderToBeActive(limitOrderOuid, makerToken);
  console.log("Limit order is active and ready for exchange");
}
