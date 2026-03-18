import { ServiceConfiguration } from "../../exchangeService/orderBook/verifyCurrencyPairExists";
import {
  disableLiquidityProviderService,
  enableTraderService,
  } from "../../serviceUtils/serviceHelpers";
import { getMemberServices } from "../../serviceUtils/serviceApi";
import { expect } from "@playwright/test";

/**
 * Configures services for standard orders (enable trader, disable liquidity provider)
 * Returns the original services state for later restoration
 */
export async function configureServicesForStandardOrders(
  memberXmi: string,
  operatorToken: string,
): Promise<ServiceConfiguration> {
  console.log("Checking current member services...");
  const originalServices = await getMemberServices(memberXmi, operatorToken);
  console.log(
    "Original services:",
    originalServices.map((s) => `${s.code}: ${s.status}`).join(", "),
  );

  // PRECONDITION: Configure services for standard orders
  console.log("\n=== Configuring services for standard orders ===");

  // Step 1: Disable Liquidity Provider service if active
  const lpService = originalServices.find((s) => s.code === "lp");
  if (lpService && lpService.status === "active") {
    console.log("Disabling Liquidity Provider (lp) service...");
    const disableLpResponse = await disableLiquidityProviderService(
      memberXmi,
      operatorToken,
    );
    expect(disableLpResponse.status()).toBe(200);
    console.log("Liquidity Provider service disabled successfully");
  }

  // Step 2: Enable Trader service if not active
  const traderService = originalServices.find((s) => s.code === "trd");
  if (!traderService || traderService.status !== "active") {
    console.log("Enabling Trader (trd) service...");
    const enableTraderResponse = await enableTraderService(
      memberXmi,
      operatorToken,
    );
    expect(enableTraderResponse.status()).toBe(200);
    console.log("Trader service enabled successfully");
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
