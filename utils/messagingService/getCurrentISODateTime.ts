export function getCurrentISODateTime(): string {
  return new Date().toISOString().replace("Z", "").split(".")[0];
}
