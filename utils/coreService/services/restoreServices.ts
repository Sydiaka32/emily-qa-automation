import {
  disableLiquidityProviderService,
  enableTraderService,
} from "../../serviceUtils/serviceHelpers";
import { getMemberServices } from "../../serviceUtils/serviceApi";
import { ServiceConfiguration } from "../../exchangeService/orderBook/verifyCurrencyPairExists";

/**
 * Restores services to their original state
 */
export async function restoreServices(
  serviceConfig: ServiceConfiguration,
): Promise<void> {
  const { originalServices, memberXmi, operatorToken } = serviceConfig;

  console.log("\n=== Cleaning up - Restoring original services ===");

  try {
    // Disable Liquidity Provider if it wasn't originally active
    const originalLp = originalServices.find((s) => s.code === "lp");
    if (!originalLp || originalLp.status !== "active") {
      console.log("Disabling Liquidity Provider (lp) service...");
      await disableLiquidityProviderService(memberXmi, operatorToken);
      console.log("Liquidity Provider service disabled");
    }

    // Enable Trader if it was originally active
    const originalTrader = originalServices.find((s) => s.code === "trd");
    if (originalTrader && originalTrader.status === "active") {
      console.log("Enabling Trader (trd) service...");
      await enableTraderService(memberXmi, operatorToken);
      console.log("Trader service enabled");
    }

    // Verify cleanup
    const finalServices = await getMemberServices(memberXmi, operatorToken);
    console.log("Final services after cleanup:");
    console.log(finalServices.map((s) => `${s.code}: ${s.status}`).join(", "));

    console.log("Service cleanup completed successfully");
  } catch (error) {
    console.error("Error during service cleanup:", error);
    // Don't fail the test if cleanup fails, but log it
  }
}

export interface TradeVerificationOptions {
  expectedPrice?: number;
  expectedQuoteQuantity?: number;
  additionalChecks?: (trade: any) => void;
}
