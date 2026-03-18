import { config } from "../../../../test.config";
import { deleteRequest } from "@utils/apiUtils/httpMethods/deleteRequest";

/**
 * Delete tariff assignment from a member via Back Office
 */
export async function deleteTariffAssignmentFromMemberBo(
  operatorToken: string,
  memberCode: string,
): Promise<{ response: any; body: any }> {
  console.log(`Deleting tariff assignment from member ${memberCode}...`);

  const endpoint = `/api/v1/core-admin/members/${memberCode}/tariffs`;

  const result = await deleteRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Delete
    tariff assignment from member request completed with status:
    ${result.response.status()}`,
  );
  return result;
}
