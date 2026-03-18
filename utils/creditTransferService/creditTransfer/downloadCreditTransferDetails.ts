import { getRequestBinary } from "@utils/apiUtils";

/**
 * Download credit transfer details
 */
export async function downloadCTDetails(
  referenceId: string,
  token: string,
): Promise<{ response: any; body: Buffer }> {
  const { response, body } = await getRequestBinary(
    `/api/v1/ct/credit-transfers/${referenceId}/details/download`,
    token,
  );

  return { response, body };
}
