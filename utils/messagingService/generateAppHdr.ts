import { generateBizMsgId } from "@utils/messagingService/generateBizMsgId";
import { getCurrentISOFormat } from "@utils/messagingService/getCurrentISOFormat";
import { AppHdrConfig } from "../../modules/messaging/appHdrConfig";

export function generateAppHdr(config: AppHdrConfig): string {
  const bizMsgId = config.bizMsgId || generateBizMsgId();
  const creDt = config.creDt || getCurrentISOFormat();

  return `
<AppHdr xmlns="urn:iso:std:iso:20022:tech:xsd:head.001.001.02">
    <Fr>
        <FIId>
            <FinInstnId>
                <Othr>
                    <Id>${config.senderMemberXmi}</Id>
                </Othr>
            </FinInstnId>
        </FIId>
    </Fr>
    <To>
        <FIId>
            <FinInstnId>
                <Othr>
                    <Id>${config.receiverMemberXmi}</Id>
                </Othr>
            </FinInstnId>
        </FIId>
    </To>
    <BizMsgIdr>${bizMsgId}</BizMsgIdr>
    <MsgDefIdr>pacs.008.001.08</MsgDefIdr>
    <BizSvc>XCTCS</BizSvc>
    <CreDt>${creDt}</CreDt>
    <PssblDplct>false</PssblDplct>
    <Prty>NORM</Prty>
</AppHdr>`.trim();
}
