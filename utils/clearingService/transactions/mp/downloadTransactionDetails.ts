import { getRequestBinary } from "@utils/apiUtils/httpMethods/getRequestBinary";

/**
 * Download transaction details for a specific transaction
 */
export async function downloadTransactionDetails(
  authToken: string,
  referenceId: string,
): Promise<{ response: any; body: Buffer }> {
  const { response, body } = await getRequestBinary(
    `/api/v1/ledger/transactions/${referenceId}/details/download`,
    authToken,
  );

  return { response, body };
}
