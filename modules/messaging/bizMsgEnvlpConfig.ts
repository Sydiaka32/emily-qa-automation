import { AppHdrConfig } from "./appHdrConfig";
import { Pacs008DocumentConfig } from "./pacs008DocumentConfig";

export interface BizMsgEnvlpConfig {
  appHdr: AppHdrConfig;
  document: Pacs008DocumentConfig;
}
