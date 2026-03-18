import { GetOperatorMessagesConfig } from "../../modules/messaging/getOperatorMessagesConfig";
import { MessagesResponse } from "../../modules/messaging/messagesResponse";

export async function getOperatorMessages(
  config: GetOperatorMessagesConfig,
): Promise<MessagesResponse> {
  const {
    request,
    backofficeBaseUrl,
    accessToken,
    search = "",
    page = 0,
    size = 10,
  } = config;

  const response = await request.get(
    `${backofficeBaseUrl}/api/v1/messaging-admin/messages`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        ...(search && { search }),
        page,
        size,
      },
    },
  );

  if (!response.ok()) {
    throw new Error(
      `Failed to get operator messages: ${response.status()} ${response.statusText()}`,
    );
  }

  return await response.json();
}
