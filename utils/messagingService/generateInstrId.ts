export function generateInstrId(): string {
  return `InstrId-pacs008-${Date.now().toString().substring(7)}`;
}
