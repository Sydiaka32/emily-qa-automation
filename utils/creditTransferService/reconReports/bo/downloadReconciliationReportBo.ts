import { getRequestBinary } from "@utils/apiUtils";
import { config } from "../../../../test.config";

/**
 * Download reconciliation report via Back Office
 */
export async function downloadReconciliationReportBo(
  filename: string,
  operatorToken: string,
): Promise<{ response: any; body: Buffer }> {
  const endpoint = `/api/v1/ct-admin/reconciliation-reports/${filename}`;

  console.log(`BO Downloading reconciliation report: ${filename}`);

  const { response, body } = await getRequestBinary(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  return { response, body };
}
