import { CollateralUpdateData } from "../../../../modules/core/collateralUpdate";
import { Collateral } from "../../../../modules/core/collaterals";
import { putMultipartRequest } from "@utils/apiUtils/httpMethods/putMultipartRequest";
import { config } from "../../../../test.config";

/**
 * Update collateral for a specific member via Back Office
 */
export async function updateMemberCollateral(
  operatorToken: string,
  memberXmi: string,
  collateralId: string,
  updateData: CollateralUpdateData,
  requestContext: any, // Pass the request context from test
): Promise<Collateral> {
  // Create form data with the JSON payload
  const formData = {
    member_collateral_update: {
      name: "blob",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(updateData)),
    },
  };

  const { response, body } = await putMultipartRequest(
    `/api/v1/core-admin/members/${memberXmi}/collaterals/${collateralId}`,
    operatorToken,
    config.backofficeBaseUrl,
    formData,
    requestContext,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Update collateral ${collateralId} for member ${memberXmi} failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
