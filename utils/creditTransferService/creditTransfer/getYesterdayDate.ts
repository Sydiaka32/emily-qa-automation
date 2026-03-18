/**
 * Get yesterday's date in YYYYMMDD format
 */
export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10).replace(/-/g, "");
}
