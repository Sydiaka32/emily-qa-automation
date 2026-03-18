import { getRequestBinary } from "@utils/apiUtils/httpMethods/getRequestBinary";

/**
 * Download member directory for credit transfer
 */
export async function downloadMemberDirectory(
  token: string,
): Promise<{ response: any; body: Buffer }> {
  const { response, body } = await getRequestBinary(
    "/api/v1/core/members/download/ct",
    token,
  );

  return { response, body };
}
