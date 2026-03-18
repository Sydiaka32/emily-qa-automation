import { getRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";

export async function getAssets(token: string): Promise<any[]> {
  const { body } = await getRequest(
    "/api/v1/ledger-admin/assets",
    token,
    config.backofficeBaseUrl, // Using the base URL from config
  );

  if (!Array.isArray(body)) {
    throw new Error("Invalid response from assets endpoint");
  }

  console.log(`Retrieved ${body.length} assets from the system`);

  // Log crypto assets for debugging
  const cryptoAssets = body.filter((asset) => asset.type === "crypto");
  console.log(
    `Found ${cryptoAssets.length} crypto assets: [${cryptoAssets.map((a) => a.code).join(", ")}]`,
  );

  return body;
}
