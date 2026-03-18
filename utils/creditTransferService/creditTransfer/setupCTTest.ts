import { ServiceConfiguration } from "../../exchangeService/orderBook/verifyCurrencyPairExists";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { config } from "../../../test.config";
import { configureServicesForCreditTransfer } from "../../coreService/services/configureServicesForCreditTransfer";
import { verifyCreditTransferServices } from "../../coreService/services/verifyCreditTransferServices";

/**
 * Common setup for credit transfer tests
 */
export async function setupCTTest(enableExchange: boolean = false): Promise<{
  senderToken: string;
  receiverToken: string;
  operatorToken: string;
  serviceConfig: ServiceConfiguration;
}> {
  console.log("Getting authentication tokens...");

  const senderToken = await getAccessToken(config.memberName, config.password);
  const receiverToken = await getAccessToken(
    config.receiverName,
    config.password,
  );
  const operatorToken = await getOperatorToken(
    config.operatorName,
    config.password,
  );

  console.log("All tokens obtained successfully");

  // Pre-condition: Configure services for credit transfer
  console.log("Configuring services for credit transfer...");
  const serviceConfig = await configureServicesForCreditTransfer(
    config.memberXmi,
    operatorToken,
    enableExchange,
  );

  // Pre-Condition 1: Verify member has all required services
  console.log("Verifying member services...");
  await verifyCreditTransferServices(
    config.memberXmi,
    operatorToken,
    enableExchange,
  );
  console.log("All required services are active");

  return { senderToken, receiverToken, operatorToken, serviceConfig };
}
