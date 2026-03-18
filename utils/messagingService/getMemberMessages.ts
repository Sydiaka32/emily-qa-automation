import { GetMessagesConfig } from "../../modules/messaging/getMessagesConfig";
import { MessagesResponse } from "../../modules/messaging/messagesResponse";

export async function getMessages(
  config: GetMessagesConfig,
): Promise<MessagesResponse> {
  const {
    request,
    apiBaseUrl,
    accessToken,
    search,
    page = 0,
    size = 10,
  } = config;

  const response = await request.get(
    `${apiBaseUrl}/api/v1/messaging/messages`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        search,
        page,
        size,
      },
    },
  );

  if (!response.ok()) {
    throw new Error(
      `Failed to get messages: ${response.status()} ${response.statusText()}`,
    );
  }

  return await response.json();
}
