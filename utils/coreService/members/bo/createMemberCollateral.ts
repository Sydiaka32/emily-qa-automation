import { CollateralCreateData } from "../../../../modules/core/collateralCreateData";
import { Collateral } from "../../../../modules/core/collaterals";
import { config } from "../../../../test.config";
import { postMultipartRequest } from "@utils/apiUtils/httpMethods/postMultipartRequest";

/**
 * Create collateral for a specific member via Back Office
 */
export async function createMemberCollateral(
  operatorToken: string,
  memberXmi: string,
  createData: CollateralCreateData,
  requestContext: any,
): Promise<Collateral> {
  // Create form data with the JSON payload
  const formData = {
    member_collateral_create: {
      name: "blob",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(createData)),
    },
  };

  const { response, body } = await postMultipartRequest(
    `/api/v1/core-admin/members/${memberXmi}/collaterals`,
    operatorToken,
    config.backofficeBaseUrl,
    formData,
    requestContext,
  );

  if (response.status() !== 201 && response.status() !== 200) {
    throw new Error(
      `Create collateral for member ${memberXmi} failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
