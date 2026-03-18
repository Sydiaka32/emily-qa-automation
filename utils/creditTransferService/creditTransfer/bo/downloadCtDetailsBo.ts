import { getRequestBinary } from "@utils/apiUtils";

/**
 * Download credit transfer details
 */
export async function downloadCTDetailsBo(
  referenceId: string,
  token: string,
  baseUrl?: string,
): Promise<{ response: any; body: Buffer }> {
  const { response, body } = await getRequestBinary(
    `/api/v1/ct-admin/credit-transfers/${referenceId}/details/download`,
    token,
    baseUrl,
  );

  return { response, body };
}
