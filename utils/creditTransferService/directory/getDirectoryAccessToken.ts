import { getAccessToken } from "@utils/auth";
import { CreditTransferConfig } from "../../../modules/creditTransfer/creditTransferConfig";

/**
 * Simple utility to get sender token for directory operations
 */
export async function getDirectoryAccessToken(
  config: CreditTransferConfig,
): Promise<string> {
  console.log("Getting directory access token...");
  const token = await getAccessToken(config.memberName, config.password);
  console.log("Directory access token obtained successfully");
  return token;
}
