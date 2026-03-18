import {
  disableClearingService,
  disableCreditTransferService,
  disableSecureMessagingService,
  disableTraderService,
  enableClearingService,
  enableCreditTransferService,
  enableSecureMessagingService,
  enableTraderService,
} from "../../serviceUtils/serviceHelpers";
import { getMemberServices } from "../../serviceUtils/serviceApi";
import { ServiceConfiguration } from "../../exchangeService/orderBook/verifyCurrencyPairExists";

/**
 * Restores services to their original state specifically for credit transfer tests
 * This is a separate function to avoid breaking existing tests that use restoreServices
 */
export async function restoreCreditTransferServices(
  serviceConfig: ServiceConfiguration,
): Promise<void> {
  const { originalServices, memberXmi, operatorToken } = serviceConfig;

  console.log(
    "\n=== Cleaning up - Restoring original services for credit transfer ===",
  );

  try {
    // Define service restoration mapping for credit transfer services
    const serviceRestorations = [
      {
        code: "clr",
        enable: enableClearingService,
        disable: disableClearingService,
      },
      {
        code: "ct",
        enable: enableCreditTransferService,
        disable: disableCreditTransferService,
      },
      {
        code: "sm",
        enable: enableSecureMessagingService,
        disable: disableSecureMessagingService,
      },
      {
        code: "trd",
        enable: enableTraderService,
        disable: disableTraderService,
      },
    ];

    for (const { code, enable, disable } of serviceRestorations) {
      const originalService = originalServices.find((s) => s.code === code);

      if (!originalService || originalService.status !== "active") {
        // Service wasn't originally active, so disable it if it's currently active
        console.log(`Disabling ${code} service (was not originally active)...`);
        try {
          await disable(memberXmi, operatorToken);
          console.log(`${code} service disabled`);
        } catch (error) {
          console.log(`Note: ${code} service might already be disabled`);
        }
      } else {
        // Service was originally active, so ensure it's enabled
        console.log(
          `Ensuring ${code} service is enabled (was originally active)...`,
        );
        try {
          await enable(memberXmi, operatorToken);
          console.log(`${code} service enabled`);
        } catch (error) {
          console.log(`Note: ${code} service might already be enabled`);
        }
      }
    }

    // Verify cleanup
    const finalServices = await getMemberServices(memberXmi, operatorToken);
    console.log("Final services after credit transfer cleanup:");
    console.log(finalServices.map((s) => `${s.code}: ${s.status}`).join(", "));

    console.log("Credit transfer service cleanup completed successfully");
  } catch (error) {
    console.error("Error during credit transfer service cleanup:", error);
    // Don't fail the test if cleanup fails, but log it
  }
}
