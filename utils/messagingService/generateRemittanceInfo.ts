export function generateRemittanceInfo(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
  let result = "Remittance information ";
  const remainingLength = 140 - result.length;
  for (let i = 0; i < remainingLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result.substring(0, 140);
}
