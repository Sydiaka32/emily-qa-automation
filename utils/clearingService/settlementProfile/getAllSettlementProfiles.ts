import { getRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { AllSettlementProfilesResponse } from "../../../modules/clearing/allSettlementProfilesResponse";

export async function getAllSettlementProfiles(
  operatorToken: string,
  page: number = 0,
  size: number = 10,
): Promise<AllSettlementProfilesResponse> {
  const { response, body } = await getRequest(
    `/api/v1/core-admin/members?services=clr&page=${page}&size=${size}`,
    operatorToken,
    config.backofficeBaseUrl, // Use backoffice base URL for operator endpoints
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get all settlement profiles failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
