/**
 * Get date string for N days ago in YYYY-MM-DD format
 */
export function getDateNDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  // Return in YYYY-MM-DD format
  return date.toISOString().split("T")[0];
}
