import { getMessages } from "./getMemberMessages";
import { Message } from "../../modules/messaging/message";
import { WaitForMessageConfig } from "../../modules/messaging/waitForMessageConfig";

/**
 * Wait for a specific message to appear in the messages list
 */
export async function waitForMessage(
  config: WaitForMessageConfig,
): Promise<Message> {
  const {
    request,
    apiBaseUrl,
    accessToken,
    search,
    expectedSenderXmi,
    expectedReceiverXmi,
    maxAttempts = 30,
    delayMs = 500,
  } = config;

  console.log(
    `Waiting for PACS.008 message with search: ${search}, sender: ${expectedSenderXmi}, receiver: ${expectedReceiverXmi}`,
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const messages = await getMessages({
        request,
        apiBaseUrl,
        accessToken,
        search,
        page: 0,
        size: 10,
      });

      // Find the PACS.008 message
      const foundMessage = messages.content.find(
        (msg: Message) =>
          msg.message_type === "pacs.008.001.08" &&
          msg.sender_xmi === expectedSenderXmi &&
          msg.receiver_xmi === expectedReceiverXmi,
      );

      if (foundMessage) {
        console.log(
          `Attempt ${attempt}/${maxAttempts}: PACS.008 message found with status: ${foundMessage.status}`,
        );

        if (foundMessage.status === "completed") {
          console.log(`PACS.008 message reached completed status`);
          return foundMessage;
        } else {
          console.log(
            `   - Current status: ${foundMessage.status}, waiting for: completed`,
          );
        }
      } else {
        console.log(
          `Attempt ${attempt}/${maxAttempts}: PACS.008 message not found yet...`,
        );
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.log(`Attempt ${attempt}/${maxAttempts} - Error: ${message}`);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `PACS.008 message not found after ${maxAttempts} attempts (search: ${search}, sender: ${expectedSenderXmi}, receiver: ${expectedReceiverXmi})`,
  );
}
