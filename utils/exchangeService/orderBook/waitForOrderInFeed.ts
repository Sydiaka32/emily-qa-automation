import { getFeed } from "@utils/apiUtils";

export async function waitForOrderInFeed(
  symbol: string,
  direction: "BID" | "ASK",
  timeout: number = 15000,
  pollInterval: number = 500,
): Promise<void> {
  const startTime = Date.now();
  let attempt = 1;

  while (Date.now() - startTime < timeout) {
    console.log(
      `Checking feed for ${direction} liquidity in ${symbol} - Attempt ${attempt}`,
    );

    const { body: feedBody } = await getFeed();
    console.log("Full feed response:", JSON.stringify(feedBody, null, 2));

    if (feedBody && feedBody.rates && Array.isArray(feedBody.rates)) {
      // Find the rate object for our symbol
      const rate = feedBody.rates.find((rate: any) => rate.pair === symbol);

      if (rate) {
        console.log(`Found rate for ${symbol}:`, rate);

        const hasLiquidity =
          direction === "ASK" ? rate.ask !== null : rate.bid !== null;

        if (hasLiquidity) {
          const liquidityValue = direction === "ASK" ? rate.ask : rate.bid;
          console.log(
            `Found ${direction} liquidity in feed for ${symbol}: ${liquidityValue}`,
          );
          return;
        } else {
          console.log(`${direction} liquidity is null for ${symbol}`);
        }
      } else {
        console.log(`No rate found for symbol ${symbol} in feed`);
        console.log(
          `Available pairs in feed:`,
          feedBody.rates.map((r: any) => r.pair),
        );
      }
    } else {
      console.log("Feed body or rates array is missing or invalid");
    }

    console.log(
      `No ${direction} liquidity found in feed for ${symbol}. Retrying...`,
    );
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    attempt++;
  }

  throw new Error(
    `No ${direction} liquidity found in feed for ${symbol} within ${timeout}ms`,
  );
}
