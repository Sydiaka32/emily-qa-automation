import { getRequestBinary } from "@utils/apiUtils/httpMethods/getRequestBinary";
import { config } from "../../../../test.config";

/**
 * Download member directory for credit transfer via Back Office
 */
export async function downloadMemberDirectoryBo(
  operatorToken: string,
): Promise<{ response: any; body: Buffer }> {
  const { response, body } = await getRequestBinary(
    "/api/v1/core-admin/members/download/ct",
    operatorToken,
    config.backofficeBaseUrl,
  );

  return { response, body };
}
