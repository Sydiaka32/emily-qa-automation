/**
 * Get yesterday's date in YYYY-MM-DD format (for API)
 */
export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  // Return in YYYY-MM-DD format
  return yesterday.toISOString().split("T")[0];
}
