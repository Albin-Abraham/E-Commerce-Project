/**
 * Format Date Utility
 *
 * Formats date values according to specified pattern tokens or standard format profiles.
 * Safe against null, undefined, invalid date strings, and numbers.
 *
 * Supported format patterns:
 * - "DD-MM-YYYY HH:mm:ss" -> e.g. 28-09-2026 21:28:00 (default)
 * - "DD-MM-YYYY"          -> e.g. 28-09-2026
 * - "YYYY-MM-DD"          -> e.g. 2026-09-28
 * - "MM/DD/YYYY"          -> e.g. 09/28/2026
 * - "HH:mm:ss"            -> e.g. 21:28:00
 */
export function formatDate(
  value: unknown,
  formatPattern: string = "DD-MM-YYYY HH:mm:ss"
): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    date = new Date(value);
  } else if (typeof value === "string") {
    date = new Date(value);
  } else {
    return "-";
  }

  if (isNaN(date.getTime())) {
    return "-";
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = String(date.getFullYear());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  switch (formatPattern) {
    case "DD-MM-YYYY HH:mm:ss":
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

    case "DD-MM-YYYY":
      return `${day}-${month}-${year}`;

    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;

    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;

    case "HH:mm:ss":
      return `${hours}:${minutes}:${seconds}`;

    default:
      // Token replacement for custom pattern strings
      return formatPattern
        .replace("YYYY", year)
        .replace("MM", month)
        .replace("DD", day)
        .replace("HH", hours)
        .replace("mm", minutes)
        .replace("ss", seconds);
  }
}
