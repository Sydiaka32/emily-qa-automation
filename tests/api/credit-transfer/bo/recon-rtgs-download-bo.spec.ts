import { test } from "@playwright/test";
import { setupReconciliationReportTest } from "@utils/creditTransferService/creditTransfer/setupReconciliationReportTest";
import { validateReconciliationReportContent } from "@utils/creditTransferService/creditTransfer/validateReconciliationReportContent";
import { SettlementTypes } from "../../../../consts/clearing/settlementTypes";
import { getOperatorToken } from "@utils/auth";
import { config } from "../../../../test.config";
import { executeReconciliationReportDownloadBo } from "@utils/creditTransferService/reconReports/bo/executeReconciliationReportDownloadBo";

test.describe("BackOffice - Reconciliation Report - Download", () => {
  let testSetup: Awaited<ReturnType<typeof setupReconciliationReportTest>>;
  let operatorToken: string;

  test.beforeAll(async () => {
    // Setup reconciliation report test
    testSetup = await setupReconciliationReportTest();

    // Get operator token for BO operations
    operatorToken = await getOperatorToken(
      config.operatorName,
      config.password,
    );
  });

  test("BO: Download reconciliation report - with content validation", async () => {
    const { memberXmi, domesticCurrency } = testSetup;

    // Execute the reconciliation report download and validation via BO
    const reportResult = await executeReconciliationReportDownloadBo(
      memberXmi,
      domesticCurrency,
      operatorToken, // Use operator token instead of sender token
      SettlementTypes.rtgs,
    );

    // Validate the report content and structure
    validateReconciliationReportContent(
      reportResult,
      memberXmi,
      domesticCurrency,
      SettlementTypes.rtgs,
    );

    console.log("\n=== BO Reconciliation Report Download Successful ===");
  });
});
