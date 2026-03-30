/**
 * Custom date display formatting with pattern tokens.
 * Only affects UI display — internal values and API serialization use ISO.
 */

/**
 * Format a date/datetime value for display using a pattern.
 *
 * Supported tokens:
 *   dd   — day of month (01-31)
 *   MM   — month (01-12)
 *   yyyy — four-digit year
 *   yy   — two-digit year
 *   HH   — hour 24h (00-23)
 *   hh   — hour 12h (01-12)
 *   mm   — minutes (00-59)
 *   ss   — seconds (00-59)
 *   a    — AM/PM
 *
 * @example
 * formatDateForDisplay("2026-03-24", "dd/MM/yyyy")         → "24/03/2026"
 * formatDateForDisplay("2026-03-24 14:30", "dd/MM/yyyy HH:mm") → "24/03/2026 14:30"
 */
export function formatDateForDisplay(
  isoValue: string,
  pattern: string,
): string {
  if (!isoValue || !pattern) return isoValue ?? "";

  const trimmed = isoValue.trim();
  if (!trimmed) return "";

  const normalized = trimmed.replace(/\s+/, "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) {
    const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      return applyPattern(
        { yyyy: dateOnly[1]!, MM: dateOnly[2]!, dd: dateOnly[3]!, HH: "00", mm: "00", ss: "00" },
        pattern,
      );
    }
    return trimmed;
  }

  const parts = {
    yyyy: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    dd: String(d.getDate()).padStart(2, "0"),
    HH: String(d.getHours()).padStart(2, "0"),
    mm: String(d.getMinutes()).padStart(2, "0"),
    ss: String(d.getSeconds()).padStart(2, "0"),
  };

  return applyPattern(parts, pattern);
}

interface DateParts {
  yyyy: string;
  MM: string;
  dd: string;
  HH: string;
  mm: string;
  ss: string;
}

function applyPattern(parts: DateParts, pattern: string): string {
  const hour24 = parseInt(parts.HH, 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 < 12 ? "AM" : "PM";

  let result = pattern;
  result = result.replace(/yyyy/g, parts.yyyy);
  result = result.replace(/yy/g, parts.yyyy.slice(-2));
  result = result.replace(/MM/g, parts.MM);
  result = result.replace(/dd/g, parts.dd);
  result = result.replace(/HH/g, parts.HH);
  result = result.replace(/hh/g, String(hour12).padStart(2, "0"));
  result = result.replace(/mm/g, parts.mm);
  result = result.replace(/ss/g, parts.ss);
  result = result.replace(/\ba\b/g, ampm);

  return result;
}
