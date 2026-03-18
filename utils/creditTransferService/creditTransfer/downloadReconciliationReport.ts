import { getRequestBinary } from "@utils/apiUtils";

/**
 * Download reconciliation report
 */
export async function downloadReconciliationReport(
  filename: string,
  token: string,
): Promise<{ response: any; body: Buffer }> {
  const { response, body } = await getRequestBinary(
    `/api/v1/ct/reconciliation-reports/${filename}`,
    token,
  );

  return { response, body };
}
