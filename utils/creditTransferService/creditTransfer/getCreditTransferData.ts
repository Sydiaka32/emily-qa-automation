import { getAccessToken, getOperatorToken } from "@utils/auth";
import { configureServicesForCreditTransfer } from "../../coreService/services/configureServicesForCreditTransfer";
import { verifyCreditTransferServices } from "../../coreService/services/verifyCreditTransferServices";
import { getCurrentMember } from "../../coreService/members/getCurrentMember";
import { getRegionLimitsForMember } from "../../coreService/regions/getRegionLimits";
import { calculateSafeCTAmountWithRegionLimits } from "./calculateSafeCtAmountWithRegionLimits";
import { verifyCTAmountWithinRegionLimits } from "./verifyCtAmountWithinRegionLimits";
import { getCreditors } from "./getCreditors";
import { findCreditorByXmi } from "./findCreditorByXmi";
import { getCreditLimit } from "../../clearingService/creditLimits/getCreditLimit";
import { extractDomesticCurrency } from "../../coreService/extractDomesticCurrency";
import { verifyCreditLimitSufficient } from "../../clearingService/creditLimits/verifyCreditLimitSufficient";
import { CreditTransferConfig } from "../../../modules/creditTransfer/creditTransferConfig";
import { CreditTransferData } from "../../../modules/creditTransfer/creditTransferData";

/**
 * Gets all required data for credit transfer including tokens, amounts, and creditor info
 */
export async function getCreditTransferData(
  config: CreditTransferConfig,
  amountPercentage: number = 0.001,
): Promise<CreditTransferData> {
  console.log("Getting credit transfer data...");

  // Get tokens for sender and receiver members
  const [senderToken, receiverToken, operatorToken] = await Promise.all([
    getAccessToken(config.memberName, config.password),
    getAccessToken(config.receiverName, config.password),
    getOperatorToken(config.operatorName, config.password),
  ]);

  console.log("All tokens obtained successfully");

  // Pre-condition: Configure services for credit transfer
  console.log("Configuring services for credit transfer...");
  await configureServicesForCreditTransfer(
    config.memberXmi,
    operatorToken,
    false, // CT without exchange
  );

  // Pre-Condition 1: Verify member has all required services
  console.log("Verifying member services...");
  await verifyCreditTransferServices(config.memberXmi, operatorToken, false);
  console.log("All required services are active");

  // Execute Pre-conditions 2 & 3 in parallel for better performance
  console.log("Getting member info and credit limits in parallel...");
  const [creditLimitData, memberInfo] = await Promise.all([
    getCreditLimit(senderToken),
    getCurrentMember(senderToken),
  ]);

  // Extract domestic currency from member info
  const senderDomesticCurrency = extractDomesticCurrency(memberInfo);
  console.log(`Domestic currency: ${senderDomesticCurrency}`);

  // Get region limits for the member
  console.log("Getting region transaction limits...");
  const regionLimits = await getRegionLimitsForMember(
    memberInfo,
    operatorToken,
  );

  // For regular CT (without exchange), use the safe amount calculation
  const ctAmount = calculateSafeCTAmountWithRegionLimits(
    creditLimitData,
    regionLimits,
  );

  // Verify the amount is within both credit and region limits
  verifyCreditLimitSufficient(creditLimitData, ctAmount);
  verifyCTAmountWithinRegionLimits(ctAmount, regionLimits);

  console.log(`Using CT amount: ${ctAmount} ${senderDomesticCurrency}`);

  // Step 1: Get creditors and find specific member from config
  console.log("Getting creditors list...");
  const creditors = await getCreditors(senderToken);

  // Find the specific creditor from config
  const creditor = findCreditorByXmi(creditors, config.receiverXmi);
  const receiverXmi = creditor.xmi;

  console.log(`Selected creditor: ${receiverXmi} - ${creditor.name}`);

  return {
    senderToken,
    receiverToken,
    operatorToken,
    senderDomesticCurrency,
    ctAmount,
    receiverXmi,
    creditor,
  };
}
