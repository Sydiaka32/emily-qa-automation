import { getCreditTransfers } from "./getCreditTransfers";

/**
 * Wait for credit transfer to reach specific status
 */
export async function waitForCreditTransferStatus(
  referenceId: string,
  expectedStatus: string,
  token: string,
  maxAttempts: number = 30,
  delayMs: number = 500,
): Promise<any> {
  console.log(
    `Waiting for credit transfer ${referenceId} to reach status: ${expectedStatus}`,
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { body } = await getCreditTransfers(token, referenceId);

      if (body.content && body.content.length > 0) {
        const creditTransfer = body.content[0];
        const currentStatus = creditTransfer.status;

        console.log(
          `Attempt ${attempt}/${maxAttempts}: Status is ${currentStatus}`,
        );

        if (currentStatus === expectedStatus) {
          console.log(
            `Credit transfer reached expected status: ${expectedStatus}`,
          );
          return creditTransfer;
        }

        // Log additional info for debugging
        console.log(
          `   - Current status: ${currentStatus}, Waiting for: ${expectedStatus}`,
        );
        console.log(`   - Updated at: ${creditTransfer.updated_at}`);
        if (creditTransfer.completed_at) {
          console.log(`   - Completed at: ${creditTransfer.completed_at}`);
        }
      }

      console.log(
        `   Attempt ${attempt}/${maxAttempts} - Status not yet ${expectedStatus}...`,
      );

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error:unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.log(
        `   Attempt ${attempt}/${maxAttempts} - Error: ${message}`,
      );
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `Credit transfer ${referenceId} did not reach status ${expectedStatus} after ${maxAttempts} attempts`,
  );
}
