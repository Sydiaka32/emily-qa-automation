import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../test.config";

/**
 * Get all resource files via Back Office
 */
export async function getResourceFilesBo(
  operatorToken: string,
): Promise<{ response: any; body: any }> {
  console.log("Getting resource files via Back Office...");

  const endpoint = `/api/v1/core-admin/resource-files`;

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Resource files request completed with status: ${result.response.status()}`,
  );
  return result;
}
