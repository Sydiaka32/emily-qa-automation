import { getCreditTransfers } from "../creditTransfer/getCreditTransfers";
import { CreditTransferTypes } from "../../../consts/credit-transfer/creditTransferTypes";

/**
 * Find credit return by original CT's tx_id
 */
export async function findCreditReturnByTxId(
  txId: string,
  token: string,
  maxAttempts: number = 30,
  delayMs: number = 500,
): Promise<any> {
  console.log(`Looking for credit return with tx_id: ${txId}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { body } = await getCreditTransfers(token, txId);

      if (body.content && body.content.length > 0) {
        // Look for the credit return in the results
        const creditReturn = body.content.find(
          (transfer: any) => transfer.type === CreditTransferTypes.creditReturn,
        );

        if (creditReturn) {
          console.log(
            `Credit return found in list (attempt ${attempt}/${maxAttempts})`,
          );
          return creditReturn;
        }
      }

      console.log(
        `Attempt ${attempt}/${maxAttempts} - Credit return not found yet...`,
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
    `Credit return with tx_id ${txId} not found in list after ${maxAttempts} attempts`,
  );
}
