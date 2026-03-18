import { getRequest } from "@utils/apiUtils";
import { TransactionsResponse } from "../../../../modules/clearing/transactionResponse";
import { config } from "../../../../test.config";

/**
 * Get clearing transactions via Back Office
 */
export async function getClearingTransactionsBo(
  operatorToken: string,
  page: number = 0,
  size: number = 10,
): Promise<TransactionsResponse> {
  const { response, body } = await getRequest(
    `/api/v1/ledger-admin/transactions?page=${page}&size=${size}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get clearing transactions via BO failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
