import { getRecallDetails } from "./getRecallDetails";

/**
 * Wait for recall to reach specific status
 */
export async function waitForRecallStatus(
  recallId: number,
  expectedStatus: string,
  token: string,
  maxAttempts: number = 30,
  delayMs: number = 500,
): Promise<any> {
  console.log(
    `Waiting for recall ${recallId} to reach status: ${expectedStatus}`,
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { body } = await getRecallDetails(recallId, token);
      const currentStatus = body.recall_status;

      console.log(
        `Attempt ${attempt}/${maxAttempts}: Recall status is ${currentStatus}`,
      );

      if (currentStatus === expectedStatus) {
        console.log(`Recall reached expected status: ${expectedStatus}`);
        return body;
      }

      console.log(
        `   - Current status: ${currentStatus}, Waiting for: ${expectedStatus}`,
      );
      console.log(`   - Updated at: ${body.recall_updated_at}`);

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.log(`   Attempt ${attempt}/${maxAttempts} - Error: ${message}`);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `Recall ${recallId} did not reach status ${expectedStatus} after ${maxAttempts} attempts`,
  );
}
