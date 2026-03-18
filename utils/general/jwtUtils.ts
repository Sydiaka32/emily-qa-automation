/**
 * Extract user ID from JWT token
 */
export function extractUserIdFromToken(token: string): string {
  try {
    // Split the token into parts: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      new Error("Invalid JWT token format");
    }

    // Decode the base64url encoded payload
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if necessary
    const padding = payloadBase64.length % 4;
    const paddedPayloadBase64 =
      padding === 0 ? payloadBase64 : payloadBase64 + "=".repeat(4 - padding);

    // Decode and parse
    const payloadJson = Buffer.from(paddedPayloadBase64, "base64").toString();
    const payload = JSON.parse(payloadJson);

    // Extract the user ID (subclaim)
    const userId = payload.sub;

    if (!userId) {
      new Error("User ID (sub) not found in token");
    }

    return userId;
  } catch (error) {
    console.error("Error extracting user ID from token:", error);
    throw new Error(
      `Failed to extract user ID from token: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
