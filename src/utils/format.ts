export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  const rounded = exponent === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[exponent]}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString.replace(" ", "T") + "Z");
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
