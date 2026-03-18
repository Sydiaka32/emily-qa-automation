import { WaitForCreditTransferConfig } from "../../../modules/creditTransfer/waitForCreditTransferConfig";
import { CreditTransfer } from "../../../modules/creditTransfer/creditTransfer";
import { CreditTransferStatuses } from "../../../consts/credit-transfer/creditTransferStatuses";
import { getCreditTransfers } from "@utils/creditTransferService/creditTransfer/getCreditTransferByTxId";

/**
 * Wait for a credit transfer to appear and reach specific status
 */
export async function waitForCreditTransfer(
  config: WaitForCreditTransferConfig,
): Promise<CreditTransfer> {
  const {
    request,
    apiBaseUrl,
    accessToken,
    search,
    expectedStatus = CreditTransferStatuses.completed,
    maxAttempts = 25,
    delayMs = 500,
  } = config;

  console.log(
    `Waiting for credit transfer with search: ${search}, expected status: ${expectedStatus}`,
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const creditTransfers = await getCreditTransfers({
        request,
        apiBaseUrl,
        accessToken,
        search,
        page: 0,
        size: 10,
      });

      // Find the credit transfer
      const foundTransfer = creditTransfers.content.find(
        (transfer: CreditTransfer) => transfer.tx_id === search,
      );

      if (foundTransfer) {
        console.log(
          `Attempt ${attempt}/${maxAttempts}: Credit transfer found with status: ${foundTransfer.status}`,
        );

        if (foundTransfer.status === expectedStatus) {
          console.log(
            `Credit transfer reached expected status: ${expectedStatus}`,
          );
          return foundTransfer;
        } else {
          console.log(
            `   - Current status: ${foundTransfer.status}, waiting for: ${expectedStatus}`,
          );
        }
      } else {
        console.log(
          `Attempt ${attempt}/${maxAttempts}: Credit transfer not found yet...`,
        );
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.log(`Attempt ${attempt}/${maxAttempts} - Error: ${message}`);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `Credit transfer not found or did not reach status ${expectedStatus} after ${maxAttempts} attempts (search: ${search})`,
  );
}
