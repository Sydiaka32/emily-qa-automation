export function generateTxId(): string {
  return `TrxId-pacs008-${Math.floor(Math.random() * 10000000)}`;
}
