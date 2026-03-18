export function generateIBAN(): string {
  return `SA${Math.random().toString().substring(2, 12).padEnd(22, "0").substring(0, 22)}`;
}
