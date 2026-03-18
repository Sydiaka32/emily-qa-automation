import { getCreditTransfers } from "./getCreditTransfers";

/**
 * Find credit transfer by reference ID in the list
 */
export async function findCreditTransferByReferenceId(
  referenceId: string,
  token: string,
  maxAttempts: number = 25,
  delayMs: number = 500,
): Promise<any> {
  console.log(`Looking for credit transfer with reference ID: ${referenceId}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { body } = await getCreditTransfers(token, referenceId);

      if (body.content && body.content.length > 0) {
        const creditTransfer = body.content[0];
        console.log(
          `Credit transfer found in list (attempt ${attempt}/${maxAttempts})`,
        );
        return creditTransfer;
      }

      console.log(
        `Attempt ${attempt}/${maxAttempts} - Credit transfer not found yet...`,
      );

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error:unknown) {
       const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.log(
        `Attempt ${attempt}/${maxAttempts} - Error: ${message}`,
      );
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `Credit transfer ${referenceId} not found in list after ${maxAttempts} attempts`,
  );
}
