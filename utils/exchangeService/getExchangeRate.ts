import { config } from "../../test.config";

export async function getExchangeRate(
  token: string,
  cryptoAsset: string,
  domesticAsset: string,
  provider: string = "REUTERS",
): Promise<number> {
  const endpoint = `/api/market/v1/market/rates/external/${cryptoAsset}/${domesticAsset}/${provider}`;

  console.log(`Fetching exchange rate from: ${endpoint}`);

  try {
    const response = await fetch(`${config.devUrl}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
    });

    if (!response.ok) {
      return Promise.reject(
        new Error(`HTTP error! status: ${response.status}`),
      );
    }

    if (!response.body) {
      return Promise.reject(new Error("No response body received"));
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let exchangeRateData: any = null;

    try {
      // Read only the first chunk and immediately close the connection
      const { done, value } = await reader.read();

      if (done) {
        return Promise.reject(
          new Error("SSE stream ended before receiving data"),
        );
      }

      const chunk = decoder.decode(value);
      console.log(`Received first SSE chunk: ${chunk}`);

      // Clean up the chunk - remove any extra whitespace or newlines
      const cleanChunk = chunk.trim();

      // Parse the first line as JSON
      const lines = cleanChunk.split("\n");

      for (const line of lines) {
        const cleanLine = line.trim();
        console.log(`Processing line: "${cleanLine}"`);

        // FIX: Handle both "data: " and "data:" formats
        if (cleanLine.startsWith("data:")) {
          // Remove 'data:' prefix and trim any whitespace
          const jsonStr = cleanLine.slice(5).trim();
          console.log(`Extracted JSON string: ${jsonStr}`);

          try {
            exchangeRateData = JSON.parse(jsonStr);
            console.log(
              "Successfully parsed exchange rate data:",
              JSON.stringify(exchangeRateData, null, 2),
            );
            break; // Use the first valid data line
          } catch (parseError: any) {
            console.log(`Failed to parse JSON: ${jsonStr}`, parseError.message);
          }
        } else if (cleanLine.startsWith("{")) {
          // Try to parse as direct JSON (without data: prefix)
          try {
            exchangeRateData = JSON.parse(cleanLine);
            console.log(
              "Parsed direct JSON data:",
              JSON.stringify(exchangeRateData, null, 2),
            );
            break;
          } catch (parseError: any) {
            console.log(
              `Failed to parse direct JSON: ${cleanLine}`,
              parseError.message,
            );
          }
        }
      }

      // Immediately cancel the reader to stop receiving more chunks
      await reader.cancel();
    } finally {
      reader.releaseLock();
    }

    if (!exchangeRateData) {
      return Promise.reject(
        new Error("No valid exchange rate data received from first SSE chunk"),
      );
    }

    // Use the mid-price (average of bid and ask) as the exchange rate
    const exchangeRate = (exchangeRateData.bid + exchangeRateData.ask) / 2;

    console.log(
      `Calculated mid-rate for ${cryptoAsset}/${domesticAsset}: ${exchangeRate}`,
    );
    console.log(
      `Rate details: bid=${exchangeRateData.bid}, ask=${exchangeRateData.ask}, mid=${exchangeRate}`,
    );

    return exchangeRate;
  } catch (error: any) {
    console.error(`Error fetching exchange rate: ${error.message}`);
    return Promise.reject(error);
  }
}
