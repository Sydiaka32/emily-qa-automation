import { getRequest } from "@utils/apiUtils";
import { ResourceFile } from "../../../modules/core/resourceFile";
import { config } from "../../../test.config";

/**
 * Get resource files via Member Portal
 */
export async function getResourceFilesMp(
  memberToken: string,
): Promise<ResourceFile[]> {
  const { response, body } = await getRequest(
    `/api/v1/core/resource-files`,
    memberToken,
    config.apiBaseUrl,
  );

  if (response.status() !== 200) {
    throw new Error(
      `Get resource files via MP failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return body;
}
