import { getRequest } from "@utils/apiUtils/httpMethods/getRequest";
import { config } from "../../../../test.config";

/**
 * Get list of members available for tariff assignment (without tariffs)
 */
export async function getAvailableMembersForTariffBo(
  operatorToken: string,
  page: number = 0,
  size: number = 25,
): Promise<{ response: any; body: any }> {
  console.log("Getting list of members available for tariff assignment...");

  const endpoint = `/api/v1/core-admin/members`;

  const params = {
    has_tariff: false,
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
    `Available members request completed with status: ${result.response.status()}`,
  );

  // Log the response structure for debugging
  if (result.response.status() === 200) {
    console.log(`Response body type: ${typeof result.body}`);
    if (Array.isArray(result.body)) {
      console.log(`Response is an array with ${result.body.length} items`);
    } else if (result.body && typeof result.body === "object") {
      console.log(
        `Response is an object, keys: ${Object.keys(result.body).join(", ")}`,
      );
    }
  }

  return result;
}
