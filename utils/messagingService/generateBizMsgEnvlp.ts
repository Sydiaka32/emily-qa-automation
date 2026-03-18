import { BizMsgEnvlpConfig } from "../../modules/messaging/bizMsgEnvlpConfig";
import { generateAppHdr } from "@utils/messagingService/generateAppHdr";
import { generatePacs008Document } from "@utils/messagingService/generatePacs008Document";

export function generateBizMsgEnvlp(config: BizMsgEnvlpConfig): string {
  const appHdr = generateAppHdr(config.appHdr);
  const document = generatePacs008Document(config.document);

  return `<?xml version="1.0" encoding="utf-8"?>
<!--Platform-->
<BizMsgEnvlp>
${appHdr}
${document}
</BizMsgEnvlp>`;
}
