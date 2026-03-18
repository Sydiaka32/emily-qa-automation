import { getCreditTransfers } from "./getCreditTransfers";

/**
 * Wait for credit transfer to reach SETTLED status (specific for RTGS)
 */
export async function waitForCreditTransferSettled(
  referenceId: string,
  token: string,
  maxAttempts: number = 25,
  delayMs: number = 500,
): Promise<any> {
  console.log(
    `Waiting for credit transfer ${referenceId} to reach SETTLED status...`,
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

        if (currentStatus === "SETTLED") {
          console.log(`Credit transfer reached expected status: SETTLED`);
          return creditTransfer;
        }

        console.log(
          `   - Current status: ${currentStatus}, Waiting for: SETTLED`,
        );
        console.log(`   - Updated at: ${creditTransfer.updated_at}`);
        if (creditTransfer.settled_at) {
          console.log(`   - Settled at: ${creditTransfer.settled_at}`);
        }
      }

      console.log(
        `   Attempt ${attempt}/${maxAttempts} - Status not yet SETTLED...`,
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
    `Credit transfer ${referenceId} did not reach status SETTLED after ${maxAttempts} attempts`,
  );
}
