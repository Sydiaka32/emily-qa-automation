import { expect } from "@playwright/test";
import {
  disableTraderService,
  enableLiquidityProviderService,
} from "../../serviceUtils/serviceHelpers";
import { ServiceConfiguration } from "../../exchangeService/orderBook/verifyCurrencyPairExists";
import { getMemberServices } from "../../serviceUtils/serviceApi";

/**
 * Configures services for Dynamic Limit orders (disable trader, enable liquidity provider)
 * Returns the original services state for later restoration
 */
export async function configureServicesForDynamicLimit(
  memberXmi: string,
  operatorToken: string,
): Promise<ServiceConfiguration> {
  console.log("Checking current member services...");
  const originalServices = await getMemberServices(memberXmi, operatorToken);
  console.log(
    "Original services:",
    originalServices.map((s) => `${s.code}: ${s.status}`).join(", "),
  );

  // PRECONDITION: Configure services for Dynamic Limit order
  console.log("\n=== Configuring services for Dynamic Limit order ===");

  // Step 1: Disable Trader service if active
  const traderService = originalServices.find((s) => s.code === "trd");
  if (traderService && traderService.status === "active") {
    console.log("Disabling Trader (trd) service...");
    const disableTraderResponse = await disableTraderService(
      memberXmi,
      operatorToken,
    );
    expect(disableTraderResponse.status()).toBe(200);
    console.log("Trader service disabled successfully");
  }

  // Step 2: Enable Liquidity Provider service if not active
  const lpService = originalServices.find((s) => s.code === "lp");
  if (!lpService || lpService.status !== "active") {
    console.log("Enabling Liquidity Provider (lp) service...");
    const enableLpResponse = await enableLiquidityProviderService(
      memberXmi,
      operatorToken,
    );
    expect(enableLpResponse.status()).toBe(200);
    console.log("Liquidity Provider service enabled successfully");
  }

  // Verify services are configured correctly
  const currentServices = await getMemberServices(memberXmi, operatorToken);
  const currentTrader = currentServices.find((s) => s.code === "trd");
  const currentLp = currentServices.find((s) => s.code === "lp");

  console.log("Current services after configuration:");
  console.log(`   - Trader (trd): ${currentTrader?.status || "not assigned"}`);
  console.log(
    `   - Liquidity Provider (lp): ${currentLp?.status || "not assigned"}`,
  );

  return {
    originalServices,
    memberXmi,
    operatorToken,
  };
}
