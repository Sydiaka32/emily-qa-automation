export function getUserIdFromJwt(token: string): string | null {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    return payload.sub || null;
  } catch (error) {
    console.error("Failed to parse JWT:", error);
    return null;
  }
}