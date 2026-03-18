import { config } from "../../../../test.config";
import { deleteRequest } from "@utils/apiUtils/deleteRequest";

/**
 * Delete collateral for a specific member via Back Office
 */
export async function deleteMemberCollateral(
  operatorToken: string,
  memberXmi: string,
  collateralId: string,
): Promise<{ response: any; body: any }> {
  return deleteRequest(
    `/api/v1/core-admin/members/${memberXmi}/collaterals/${collateralId}`,
    operatorToken,
    config.backofficeBaseUrl,
  );
}
