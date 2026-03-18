import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Get list of members with assigned tariffs
 */
export async function getAssignedTariffsForMembersBo(
  operatorToken: string,
  page: number = 0,
  size: number = 25,
): Promise<{ response: any; body: any }> {
  console.log("Getting list of members with assigned tariffs...");

  const endpoint = `/api/v1/core-admin/members`;

  const params = {
    has_tariff: true,
    with_ledger_settings: true,
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
    `Assigned tariffs for members request completed with status: ${result.response.status()}`,
  );

  // Log the response structure for debugging
  if (result.response.status() === 200) {
    console.log(`Response body type: ${typeof result.body}`);
    if (result.body && typeof result.body === "object") {
      console.log(
        `Response is an object, keys: ${Object.keys(result.body).join(", ")}`,
      );
    }
  }

  return result;
}
