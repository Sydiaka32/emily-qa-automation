import { test, expect } from "@playwright/test";
import { getMessages } from "@utils/messagingService/getMemberMessages";
import { getAccessToken } from "@utils/auth";
import { config } from "../../../../test.config";

test.describe("GET /api/v1/messaging/messages", () => {
  let accessToken: string;
  const apiBaseUrl = config.apiBaseUrl;

  test.beforeAll(async () => {
    // Get access token for authentication
    accessToken = await getAccessToken(config.memberName, config.password);
  });

  test("should retrieve messages list with pagination", async ({ request }) => {
    // Get messages without search filter to get all messages
    const messagesResponse = await getMessages({
      request,
      apiBaseUrl,
      accessToken,
      search: "",
      page: 0,
      size: 10,
    });

    // Verify response structure
    expect(messagesResponse).toHaveProperty("total_pages");
    expect(messagesResponse).toHaveProperty("total_elements");
    expect(messagesResponse).toHaveProperty("number");
    expect(messagesResponse).toHaveProperty("size");
    expect(messagesResponse).toHaveProperty("first");
    expect(messagesResponse).toHaveProperty("last");
    expect(messagesResponse).toHaveProperty("has_next");
    expect(messagesResponse).toHaveProperty("has_previous");
    expect(messagesResponse).toHaveProperty("content");
    expect(Array.isArray(messagesResponse.content)).toBe(true);

    // Verify content array has correct size (up to the requested size)
    expect(messagesResponse.content.length).toBeLessThanOrEqual(10);

    // If there are messages, verify their structure
    if (messagesResponse.content.length > 0) {
      const message = messagesResponse.content[0];

      // Verify message structure
      expect(message).toHaveProperty("xid");
      expect(message).toHaveProperty("clr_sys_ref");
      expect(message).toHaveProperty("tx_id");
      expect(message).toHaveProperty("sender_xmi");
      expect(message).toHaveProperty("receiver_xmi");
      expect(message).toHaveProperty("message_type");
      expect(message).toHaveProperty("date");
      expect(message).toHaveProperty("status");
      expect(message).toHaveProperty("msg_id");
      expect(message).toHaveProperty("cre_dt_tm");
    }
  });
});
