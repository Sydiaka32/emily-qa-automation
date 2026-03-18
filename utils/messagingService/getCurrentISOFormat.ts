export function getCurrentISOFormat(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "+01:00");
}
