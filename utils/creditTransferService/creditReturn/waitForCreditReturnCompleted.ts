import { getRequest } from "@utils/apiUtils";

/**
 * Wait for credit return to reach COMPLETED status with proper status progression logging
 */
export async function waitForCreditReturnCompleted(
  referenceId: string,
  token: string,
  maxAttempts: number = 60,
  delayMs: number = 1000,
): Promise<any> {
  console.log(
    `Waiting for credit return ${referenceId} to reach COMPLETED status...`,
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Use the specific credit transfer endpoint to get details
      const { response, body } = await getRequest(
        `/api/v1/ct/credit-transfers/${referenceId}`,
        token,
      );

      if (response.status() === 200 && body) {
        const currentStatus = body.status;

        console.log(
          `Attempt ${attempt}/${maxAttempts}: Status is ${currentStatus}`,
        );

        // Always log current status and what we're waiting for
        console.log(
          `   - Current status: ${currentStatus}, Waiting for: COMPLETED`,
        );
        console.log(`   - Updated at: ${body.updated_at}`);

        if (body.completed_at) {
          console.log(`   - Completed at: ${body.completed_at}`);
        }

        if (currentStatus === "COMPLETED") {
          console.log(`Credit return reached expected status: COMPLETED`);
          return body;
        }

        // Log the waiting message for non-completed status
        console.log(
          `   Attempt ${attempt}/${maxAttempts} - Status not yet COMPLETED...`,
        );
      } else {
        console.log(
          `Attempt ${attempt}/${maxAttempts}: Could not fetch credit return details, status: ${response.status()}`,
        );
        console.log(
          `   Attempt ${attempt}/${maxAttempts} - Status not yet COMPLETED...`,
        );
      }

      // Wait before next attempt (except on the last attempt)
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.log(`   Attempt ${attempt}/${maxAttempts} - Error: ${message}`);
      console.log(
        `   Attempt ${attempt}/${maxAttempts} - Status not yet COMPLETED...`,
      );

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `Credit return ${referenceId} did not reach status COMPLETED after ${maxAttempts} attempts`,
  );
}
