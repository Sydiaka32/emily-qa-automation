import { getFeed } from "@utils/apiUtils";

export async function verifyOrderBookIsEmpty(
  symbol: string,
  maxAttempts: number = 50,
  delayMs: number = 400,
): Promise<void> {
  console.log(`Verifying order book is empty for ${symbol}...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { response, body } = await getFeed();

      if (response.status() !== 200) {
        new Error(`Feed API returned status: ${response.status()}`);
      }

      // Safe array access
      const rates = (body && body.rates) || [];

      const symbolInFeed = rates.find(
        (rate: any) => rate && rate.pair === symbol,
      );

      if (!symbolInFeed) {
        console.log(`Order book is empty for ${symbol} (attempt ${attempt})`);
        return;
      }

      console.log(
        `   Attempt ${attempt}/${maxAttempts} - Order book still has data for ${symbol}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.log(`   Attempt ${attempt}/${maxAttempts} - Error: ${message}`);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(
    `Order book for ${symbol} is not empty after ${maxAttempts} attempts`,
  );
}
