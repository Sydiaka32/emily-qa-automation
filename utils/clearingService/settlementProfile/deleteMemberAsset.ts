import { deleteRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";


export async function deleteMemberAsset(
  operatorToken: string,
  memberXmi: string,
  assetCode: string,
): Promise<{ response: any; body: any }> {
  const { response, body } = await deleteRequest(
    `/api/v1/settlement-admin/profiles/${memberXmi}/${assetCode}`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  // Accept both 200 (OK) and 204 (No Content) as success statuses
  if (response.status() !== 200) {
    throw new Error(
      `Delete member asset failed with status ${response.status()}: ${JSON.stringify(body)}`,
    );
  }

  return { response, body };
}
