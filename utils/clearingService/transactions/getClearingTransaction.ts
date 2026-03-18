import { getRequest } from "@utils/apiUtils";
import { TransactionsResponse } from "../../../modules/clearing/transactionResponse";

export async function getClearingTransactions(
  authToken: string,
  page: number = 0,
  size: number = 10,
): Promise<TransactionsResponse> {
  const { response, body } = await getRequest(
    `/api/v1/ledger/transactions?page=${page}&size=${size}`,
    authToken,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get transactions failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
