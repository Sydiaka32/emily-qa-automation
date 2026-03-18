/**
 * Extract user ID from JWT token (for Back Office)
 */
export function extractUserIdFromTokenBo(token: string): string {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);
    return payload.user_id || payload.sub || "";
  } catch (error) {
    console.log("Error extracting user ID from token:", error);
    return "";
  }
}
