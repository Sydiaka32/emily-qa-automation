export function getCurrentISODate(): string {
  return new Date().toISOString().split("T")[0];
}
