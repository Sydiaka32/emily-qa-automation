import { config } from "../../../../test.config";
import { putRequest } from "@utils/apiUtils/httpMethods/putRequest";

/**
 * Assign a tariff to a member via Back Office
 */
export async function assignTariffToMemberBo(
  operatorToken: string,
  memberCode: string,
  tariffCode: string,
): Promise<{ response: any; body: any }> {
  console.log(`Assigning tariff ${tariffCode} to member ${memberCode}...`);

  const endpoint = `/api/v1/core-admin/members/${memberCode}/tariffs/${tariffCode}`;

  const result = await putRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
    {}, // empty payload
  );

  console.log(
    `Assign tariff to member request completed with status: ${result.response.status()}`,
  );
  return result;
}
