import { test } from "@playwright/test";
import { setupReconciliationReportTest } from "@utils/creditTransferService/creditTransfer/setupReconciliationReportTest";
import { executeReconciliationReportDownload } from "@utils/creditTransferService/creditTransfer/executeReconciliationReportDownload";
import { validateReconciliationReportContent } from "@utils/creditTransferService/creditTransfer/validateReconciliationReportContent";
import { SettlementTypes } from "../../../../consts/clearing/settlementTypes";

test.describe("Reconciliation Report - Download", () => {
  let testSetup: Awaited<ReturnType<typeof setupReconciliationReportTest>>;

  test.beforeAll(async () => {
    testSetup = await setupReconciliationReportTest();
  });

  test("Download reconciliation report - with content validation", async () => {
    const { senderToken, memberXmi, domesticCurrency } = testSetup;

    // Execute the reconciliation report download and validation
    const reportResult = await executeReconciliationReportDownload(
      memberXmi,
      domesticCurrency,
      senderToken,
      SettlementTypes.dns,
    );

    // Validate the report content and structure
    validateReconciliationReportContent(
      reportResult,
      memberXmi,
      domesticCurrency,
      SettlementTypes.dns,
    );
  });
});
