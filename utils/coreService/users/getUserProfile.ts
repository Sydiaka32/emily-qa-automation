import { getRequest } from "@utils/apiUtils";
import { UserProfile } from "../../../modules/core/userProfile";
import { config } from "../../../test.config";

/**
 * Get user profile via Member Portal
 */
export async function getUserProfile(
  memberToken: string,
  userId: string,
): Promise<UserProfile> {
  const { response, body } = await getRequest(
    `/api/v1/core/users/${userId}`,
    memberToken,
    config.apiBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get user profile via MP failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
