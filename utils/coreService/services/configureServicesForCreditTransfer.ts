import { APIResponse, expect } from "@playwright/test";
import {
  enableClearingService,
  enableCreditTransferService,
  enableSecureMessagingService,
  enableTraderService,
} from "../../serviceUtils/serviceHelpers";
import { getMemberServices } from "../../serviceUtils/serviceApi";
import { ServiceConfiguration } from "../../exchangeService/orderBook/verifyCurrencyPairExists";

/**
 * Configures services for Credit Transfer
 * Returns the original services state for later restoration
 */
export async function configureServicesForCreditTransfer(
  memberXmi: string,
  operatorToken: string,
  withExchange: boolean = false,
): Promise<ServiceConfiguration> {
  console.log("Checking current member services...");
  const originalServices = await getMemberServices(memberXmi, operatorToken);
  console.log(
    "Original services:",
    originalServices.map((s) => `${s.code}: ${s.status}`).join(", "),
  );

  // PRECONDITION: Configure services for Credit Transfer
  console.log("\n=== Configuring services for Credit Transfer ===");

  const requiredServices = ["clr", "ct", "sm"];
  if (withExchange) {
    requiredServices.push("trd");
  }

  console.log(`Required services: ${requiredServices.join(", ")}`);
  if (withExchange) {
    console.log("(Including trader service for CT with exchange)");
  }

  // Enable each required service if not active
  for (const serviceCode of requiredServices) {
    const service = originalServices.find((s) => s.code === serviceCode);

    if (!service || service.status !== "active") {
      console.log(`Enabling ${serviceCode} service...`);

      let enableResponse: APIResponse;
      switch (serviceCode) {
        case "clr":
          enableResponse = await enableClearingService(
            memberXmi,
            operatorToken,
          );
          break;
        case "ct":
          enableResponse = await enableCreditTransferService(
            memberXmi,
            operatorToken,
          );
          break;
        case "sm":
          enableResponse = await enableSecureMessagingService(
            memberXmi,
            operatorToken,
          );
          break;
        case "trd":
          enableResponse = await enableTraderService(memberXmi, operatorToken);
          break;
        default:
          throw new Error(`Unknown service code: ${serviceCode}`);
      }

      expect(enableResponse.status()).toBe(200);
      console.log(`${serviceCode} service enabled successfully`);
    } else {
      console.log(`${serviceCode} service is already active`);
    }
  }


  // Verify services are configured correctly
  const currentServices = await getMemberServices(memberXmi, operatorToken);

  console.log("Current services after configuration:");
  requiredServices.forEach((serviceCode) => {
    const currentService = currentServices.find((s) => s.code === serviceCode);
    console.log(
      `   - ${serviceCode}: ${currentService?.status || "not assigned"}`,
    );
  });

  // Verify all required services are active
  const missingServices = requiredServices.filter((serviceCode) => {
    const service = currentServices.find((s) => s.code === serviceCode);
    return !service || service.status !== "active";
  });

  if (missingServices.length > 0) {
    throw new Error(
      `Failed to enable required services: ${missingServices.join(", ")}`,
    );
  }

  console.log("All required services for credit transfer are active");

  return {
    originalServices,
    memberXmi,
    operatorToken,
  };
}
