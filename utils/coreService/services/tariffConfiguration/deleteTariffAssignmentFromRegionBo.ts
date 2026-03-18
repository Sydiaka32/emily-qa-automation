import { config } from "../../../../test.config";
import { deleteRequest } from "@utils/apiUtils/httpMethods/deleteRequest";

/**
 * Delete tariff assignment from a region via Back Office
 */
export async function deleteTariffAssignmentFromRegionBo(
  operatorToken: string,
  regionCode: string,
): Promise<{ response: any; body: any }> {
  console.log(`Deleting tariff assignment from region ${regionCode}...`);

  const endpoint = `/api/v1/core-admin/regions/${regionCode}/tariffs`;

  const result = await deleteRequest(
    endpoint,
    operatorToken,
    config.backofficeBaseUrl,
  );

  console.log(
    `Delete
    tariff assignment from region request completed with status:
    ${result.response.status()}`,
  );
  return result;
}
