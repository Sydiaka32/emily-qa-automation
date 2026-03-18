import { config } from "../../../test.config";
import { getCreditLimit } from "../../clearingService/creditLimits/getCreditLimit";
import { getCurrentMember } from "../../coreService/members/getCurrentMember";
import { extractDomesticCurrency } from "../../coreService/extractDomesticCurrency";
import { getRegionLimitsForMember } from "../../coreService/regions/getRegionLimits";
import { calculateSafeCTAmountWithRegionLimits } from "./calculateSafeCtAmountWithRegionLimits";
import { verifyCreditLimitSufficient } from "../../clearingService/creditLimits/verifyCreditLimitSufficient";
import { verifyCTAmountWithinRegionLimits } from "./verifyCtAmountWithinRegionLimits";
import { getCreditors } from "./getCreditors";
import { findCreditorByXmi } from "./findCreditorByXmi";
import { createAndValidateCreditTransfer } from "./createAndValidateCreditTransfer";
import { initiateCreditTransfer } from "./initiateCreditTransfer";
import { verifyRTGSCreditTransferCompletion } from "./verifyRtgsCreditTransferCompletion";
import { SettlementTypes } from "../../../consts/clearing/settlementTypes";
import { getAccessToken, getOperatorToken } from "@utils/auth";
import { SettledRTGSCreditTransferSetup } from "../../../modules/creditTransfer/settledRTGSCreditTransferSetup";

/**
 * Sets up a settled RTGS credit transfer for testing credit returns
 */
export async function setupSettledRTGSCreditTransfer(): Promise<SettledRTGSCreditTransferSetup> {
  console.log("Setting up settled RTGS credit transfer for return testing...");

  // Get authentication tokens
  const [senderToken, receiverToken, operatorToken] = await Promise.all([
    getAccessToken(config.memberName, config.password),
    getAccessToken(config.receiverName, config.password),
    getOperatorToken(config.operatorName, config.password),
  ]);

  console.log("All tokens obtained successfully");

  // Pre-condition: Get member info and credit limits
  console.log("Getting member info and credit limits...");
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

  // Set CT amount based on credit limit AND region limits
  const ctAmount = calculateSafeCTAmountWithRegionLimits(
    creditLimitData,
    regionLimits,
  );

  // Verify the amount is within both credit and region limits
  verifyCreditLimitSufficient(creditLimitData, ctAmount);
  verifyCTAmountWithinRegionLimits(ctAmount, regionLimits);

  console.log(`Using RTGS CT amount: ${ctAmount} ${senderDomesticCurrency}`);

  // Step 1: Get creditors and find specific member from config
  console.log("Getting creditors list...");
  const creditors = await getCreditors(senderToken);

  // Find the specific creditor from config
  const creditor = findCreditorByXmi(creditors, config.receiverXmi);
  const receiverXmi = creditor.xmi;

  console.log(`Selected creditor: ${receiverXmi} - ${creditor.name}`);

  // Step 2: Create RTGS credit transfer and validate
  console.log("Creating RTGS credit transfer...");
  const createResult = await createAndValidateCreditTransfer({
    creditorXmi: receiverXmi,
    creditorCurrency: senderDomesticCurrency,
    creditorAmount: ctAmount,
    settlementType: SettlementTypes.rtgs,
    debtorXmi: config.memberXmi,
    token: senderToken,
    debtorName: "Test Debtor Bank",
    creditorName: creditor.name,
    remittanceInformation: "API Test - RTGS Credit Return Test CT",
  });

  const creditTransferValidationId = createResult.validationId;
  console.log(
    `RTGS credit transfer created with validation ID: ${creditTransferValidationId}`,
  );

  // Step 3: Initiate RTGS credit transfer
  console.log("Initiating RTGS credit transfer...");
  const initiateResult = await initiateCreditTransfer(
    creditTransferValidationId,
    senderToken,
  );

  console.log(
    "Initiate response body:",
    JSON.stringify(initiateResult.body, null, 2),
  );

  const creditTransferReferenceId = initiateResult.referenceId;
  console.log(
    `RTGS credit transfer initiated with reference ID: ${creditTransferReferenceId}`,
  );

  // Pre-condition: Wait for RTGS CT to reach SETTLED status
  console.log("\n=== Waiting for RTGS CT to reach SETTLED status ===");
  const settledCT = await verifyRTGSCreditTransferCompletion(
    creditTransferReferenceId,
    senderToken,
    config.memberXmi,
    receiverXmi,
    ctAmount,
    senderDomesticCurrency,
  );

  console.log("RTGS CT settled successfully");
  console.log(`RTGS CT Status: ${settledCT.status}`);
  console.log(`RTGS CT Settled At: ${settledCT.settled_at}`);

  const originalTxId = settledCT.tx_id;
  console.log(`Original RTGS CT tx_id: ${originalTxId}`);

  return {
    senderToken,
    receiverToken,
    operatorToken,
    creditTransferReferenceId,
    settledCT,
    senderDomesticCurrency,
    ctAmount,
    receiverXmi,
    originalTxId,
  };
}
