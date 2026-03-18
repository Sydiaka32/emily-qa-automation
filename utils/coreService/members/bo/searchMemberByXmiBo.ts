import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Search for a member by XMI via Back Office
 */
export async function searchMemberByXmiBo(
  operatorToken: string,
  xmi: string,
  page: number = 0,
  size: number = 10,
): Promise<{ response: any; body: any }> {
  console.log(`Searching for member with XMI: ${xmi}...`);

  const endpoint = `/api/v1/core-admin/members`;

  const params = {
    search: xmi,
    page: page,
    size: size,
  };

  const result = await getRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
    params,
  );

  console.log(
    `Search member by XMI request completed with status: ${result.response.status()}`,
  );
  return result;
}
