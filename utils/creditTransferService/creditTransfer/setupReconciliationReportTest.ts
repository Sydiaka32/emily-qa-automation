import { getCurrentMember } from "../../coreService/members/getCurrentMember";
import { setupCTTest } from "./setupCTTest";
import { ReconciliationReportTestSetup } from "../../../modules/creditTransfer/reconciliationReportSetup";

/**
 * Sets up the reconciliation report test environment
 */
export async function setupReconciliationReportTest(): Promise<ReconciliationReportTestSetup> {
  console.log("Setting up reconciliation report test...");

  const setup = await setupCTTest(false);
  const senderToken = setup.senderToken;
  const serviceConfig = setup.serviceConfig;

  // Get member info
  const memberInfo = await getCurrentMember(senderToken);
  const memberXmi = memberInfo.xmi;
  const domesticCurrency = memberInfo.domestic_currency;

  console.log(`Member XMI: ${memberXmi}`);
  console.log(`Domestic Currency: ${domesticCurrency}`);

  return {
    senderToken,
    serviceConfig,
    memberInfo,
    memberXmi,
    domesticCurrency,
  };
}
