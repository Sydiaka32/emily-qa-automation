import { getRequest } from "@utils/apiUtils";
import { config } from "../../../../test.config";

/**
 * Helper function to wait for recall status via BO
 */
export async function waitForRecallStatusBo(
  recallId: number,
  operatorToken: string,
  expectedStatus: string,
  maxAttempts: number = 30,
  delayMs: number = 500,
): Promise<any> {
  console.log(
    `[BO] Waiting for recall ${recallId} to reach status: ${expectedStatus}`,
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `[BO] Attempt ${attempt}/${maxAttempts}: Fetching recall details`,
      );

      const { response, body } = await getRequest(
        `/api/v1/ct-admin/recalls/${recallId}`,
        operatorToken,
        config.backofficeBaseUrl,
      );

      // Check response status
      if (response.status() !== 200) {
        await new Error(`HTTP ${response.status()}: ${JSON.stringify(body)}`);
      }

      const currentStatus = body.recall_status;
      console.log(`[BO] Current recall status: ${currentStatus}`);

      if (currentStatus === expectedStatus) {
        console.log(`[BO] Recall reached expected status: ${expectedStatus}`);
        return body;
      }

      console.log(
        `[BO] - Current status: ${currentStatus}, Waiting for: ${expectedStatus}`,
      );

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error: any) {
      console.log(
        `[BO] Attempt ${attempt}/${maxAttempts} - Error: ${error.message}`,
      );
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `[BO] Recall ${recallId} did not reach status ${expectedStatus} after ${maxAttempts} attempts`,
  );
}
