export function generateBizMsgId(): string {
  return `BizMsgIdr-pacs008-${Date.now()}${Math.random().toString(36).substring(2, 6)}`;
}
