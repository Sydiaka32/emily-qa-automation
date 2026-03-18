import { Pacs008DocumentConfig } from "../../modules/messaging/pacs008DocumentConfig";
import { generateMsgId } from "@utils/messagingService/generateMsgId";
import { getCurrentISODateTime } from "@utils/messagingService/getCurrentISODateTime";
import { getCurrentISODate } from "@utils/messagingService/getCurrentISODate";
import { generateInstrId } from "@utils/messagingService/generateInstrId";
import { generateTxId } from "@utils/messagingService/generateTxId";
import { generateEndToEndId } from "@utils/messagingService/generateEndToEndId";
import { generateUETR } from "@utils/messagingService/generateUETR";
import { generateIBAN } from "@utils/messagingService/generateIBAN";
import { generateRemittanceInfo } from "@utils/messagingService/generateRemittanceInfo";

export function generatePacs008Document(config: Pacs008DocumentConfig): string {
  const msgId = config.msgId || generateMsgId();
  const creDtTm = config.creDtTm || getCurrentISODateTime();
  const intrBkSttlmDt = config.intrBkSttlmDt || getCurrentISODate();

  return `
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
    <FIToFICstmrCdtTrf>
        <GrpHdr>
            <MsgId>${msgId}</MsgId>
            <CreDtTm>${creDtTm}</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
            <SttlmInf>
                <SttlmMtd>CLRG</SttlmMtd>
            </SttlmInf>
        </GrpHdr>
        <CdtTrfTxInf>
            <PmtId>
                <InstrId>${generateInstrId()}</InstrId>
                <EndToEndId>${generateEndToEndId()}</EndToEndId>
                <TxId>${generateTxId()}</TxId>
                <UETR>${generateUETR()}</UETR>
            </PmtId>
            <PmtTpInf>
                <CtgyPurp>
                    <Cd>SALA</Cd>
                </CtgyPurp>
            </PmtTpInf>
            <IntrBkSttlmAmt Ccy="SAR">${config.intrBkSttlmAmt}</IntrBkSttlmAmt>
            <IntrBkSttlmDt>${intrBkSttlmDt}</IntrBkSttlmDt>
            <ChrgBr>DEBT</ChrgBr>
            <InstgAgt>
                <FinInstnId>
                    <Othr>
                        <Id>${config.instgAgtId}</Id>
                    </Othr>
                </FinInstnId>
            </InstgAgt>
            <InstdAgt>
                <FinInstnId>
                    <Othr>
                        <Id>${config.instdAgtId}</Id>
                    </Othr>
                </FinInstnId>
            </InstdAgt>
            <UltmtDbtr>
                <Nm>UltmtDbtr Name</Nm>
                <CtryOfRes>AR</CtryOfRes>
            </UltmtDbtr>
            <Dbtr>
                <Nm>Debtor Name in SA</Nm>
                <PstlAdr>
                    <Ctry>SA</Ctry>
                    <AdrLine>Debtor: Address line 1</AdrLine>
                    <AdrLine>Debtor: Address line 2</AdrLine>
                    <AdrLine>Debtor: Address line 3</AdrLine>
                </PstlAdr>
            </Dbtr>
            <DbtrAcct>
                <Id>
                    <Othr>
                        <Id>2898272785</Id>
                    </Othr>
                </Id>
            </DbtrAcct>
            <DbtrAgt>
                <FinInstnId>
                    <Nm>Debtor agent name33</Nm>
                    <Othr>
                        <Id>${config.dbtrAgentId}</Id>
                    </Othr>
                </FinInstnId>
            </DbtrAgt>
            <CdtrAgt>
                <FinInstnId>
                    <BICFI>BCRBBIBI</BICFI>
                    <Nm>Creditor Agent Name</Nm>
                </FinInstnId>
            </CdtrAgt>
            <Cdtr>
                <Nm>Creditor Name</Nm>
                <PstlAdr>
                    <Ctry>SA</Ctry>
                    <AdrLine>Creditor: Address line 1</AdrLine>
                    <AdrLine>Creditor: Address line 2</AdrLine>
                    <AdrLine>Creditor: Address line 3</AdrLine>
                </PstlAdr>
                <Id>
                    <OrgId>
                        <LEI>HD5O21F80BF95699B348</LEI>
                    </OrgId>
                </Id>
            </Cdtr>
            <CdtrAcct>
                <Id>
                    <IBAN>${generateIBAN()}</IBAN>
                </Id>
            </CdtrAcct>
            <InstrForCdtrAgt>
                <InstrInf>string</InstrInf>
            </InstrForCdtrAgt>
            <InstrForCdtrAgt>
                <Cd>HOLD</Cd>
            </InstrForCdtrAgt>
            <Purp>
                <Prtry>Fee Collection And Interest</Prtry>
            </Purp>
            <RmtInf>
                <Ustrd>${generateRemittanceInfo()}</Ustrd>
            </RmtInf>
        </CdtTrfTxInf>
    </FIToFICstmrCdtTrf>
</Document>`.trim();
}
