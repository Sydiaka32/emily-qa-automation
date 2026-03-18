import { SendIsoMessageConfig } from "../../modules/messaging/sendIsoMessageConfig";

export async function sendIsoMessage(
  config: SendIsoMessageConfig,
): Promise<any> {
  const response = await config.request.post(
    `${config.restApiUrl}/api/v1/messaging/messages`,
    {
      headers: {
        accept: "application/xml",
        "X-API-KEY": config.apiKey,
        "Content-Type": "application/xml",
      },
      data: config.xmlMessage,
    },
  );

  return {
    status: response.status(),
    body: await response.text(),
  };
}
