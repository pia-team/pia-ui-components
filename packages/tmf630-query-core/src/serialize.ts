/**
 * Serialize FilterCondition[] → TMF630 query params (field.operator=value).
 * Date fields can be normalized to ISO-8601 via options.dateFields.
 */

import type { FilterCondition, QueryParamValue } from "./types.js";

const MULTI_VALUE_OPERATORS = new Set(["between", "in", "nin"]);
const NULL_CHECK_OPERATORS = new Set(["isnull", "isnotnull"]);

export interface SerializeFiltersOptions {
  /** Field names that receive ISO-8601 date normalization */
  dateFields?: Set<string> | string[];
}

function toDateFieldsSet(dateFields?: Set<string> | string[]): Set<string> {
  if (!dateFields) return new Set();
  return dateFields instanceof Set
    ? dateFields
    : new Set(dateFields);
}

/**
 * Build the local timezone offset string (e.g. "+03:00", "-05:00", "Z").
 * Uses the runtime timezone by default.
 */
export function getLocalTimezoneOffset(date?: Date): string {
  const d = date ?? new Date();
  const offset = d.getTimezoneOffset();
  if (offset === 0) return "Z";
  const sign = offset < 0 ? "+" : "-";
  const absMin = Math.abs(offset);
  const h = String(Math.floor(absMin / 60)).padStart(2, "0");
  const m = String(absMin % 60).padStart(2, "0");
  return `${sign}${h}:${m}`;
}

/**
 * Normalize a date/datetime string to full ISO-8601 with timezone for the API.
 * User-entered values (YYYY-MM-DD, YYYY-MM-DD HH:mm) are treated as **local time**
 * and the runtime timezone offset is appended.
 *
 *   YYYY-MM-DD           → YYYY-MM-DDT00:00:00+03:00  (local midnight)
 *   YYYY-MM-DD HH:mm     → YYYY-MM-DDTHH:mm:00+03:00  (local time)
 *   YYYY-MM-DD HH:mm:ss  → YYYY-MM-DDTHH:mm:ss+03:00  (local time)
 *   ISO-8601 strings      → preserved as-is
 */
export function normalizeDateToISO(value: string): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const tz = getLocalTimezoneOffset(new Date(`${trimmed}T00:00:00`));
    return `${trimmed}T00:00:00${tz}`;
  }

  const dateTimeMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (dateTimeMatch) {
    const [, date, hh, mm, ss] = dateTimeMatch;
    const tz = getLocalTimezoneOffset(
      new Date(`${date}T${hh}:${mm}:${ss ?? "00"}`),
    );
    return `${date}T${hh}:${mm}:${ss ?? "00"}${tz}`;
  }

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

/**
 * Normalize a date string to YYYY-MM-DD for display only.
 */
export function normalizeDateToYYYYMMDD(value: string): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/\s+/, "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Normalize a date/time string to YYYY-MM-DD HH:mm for display.
 * Preserves time component if present; returns date-only if no time info.
 */
/**
 * Normalize a date/time string to YYYY-MM-DD HH:mm for display.
 * Always includes time component — date-only values get 00:00 appended.
 */
export function normalizeDateTimeForDisplay(value: string): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed} 00:00`;
  const dtMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
  if (dtMatch) return `${dtMatch[1]} ${dtMatch[2]}`;
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (isoMatch) {
    const [, date, hh, mm] = isoMatch;
    return `${date} ${hh}:${mm}`;
  }
  return trimmed;
}

function normalizeFilterValue(
  field: string,
  value: string | string[],
  dateFields: Set<string>,
): string | string[] {
  if (!dateFields.has(field)) return value;
  if (Array.isArray(value)) {
    return value.map((v) => normalizeDateToISO(String(v)) || String(v));
  }
  const normalized = normalizeDateToISO(String(value));
  return normalized || value;
}

/**
 * Serialize filters to query parameter record.
 * - Format: field.operator = value
 * - Multi-value (between, in, nin): value is string[]
 * - Null checks (isnull, isnotnull): value "true"
 * - Date eq/ne with date-only input: expanded to gte/lt range for full-day match
 */
export function serializeFilters(
  filters: FilterCondition[],
  options?: SerializeFiltersOptions,
): Record<string, QueryParamValue> {
  const dateFields = toDateFieldsSet(options?.dateFields);
  const params: Record<string, QueryParamValue> = {};

  for (const filter of filters) {
    if (!filter.field) continue;

    if (NULL_CHECK_OPERATORS.has(filter.operator)) {
      params[`${filter.field}.${filter.operator}`] = "true";
      continue;
    }

    const rawValue = filter.value;
    const isEmpty = Array.isArray(rawValue)
      ? rawValue.every((v) => String(v).trim() === "")
      : String(rawValue ?? "").trim() === "";
    if (isEmpty) continue;

    if (
      dateFields.has(filter.field) &&
      (filter.operator === "eq" || filter.operator === "ne") &&
      typeof rawValue === "string"
    ) {
      const trimmedVal = rawValue.trim();
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmedVal);
      if (isDateOnly) {
        const localMidnight = new Date(`${trimmedVal}T00:00:00`);
        const tz = getLocalTimezoneOffset(localMidnight);
        const dayStart = `${trimmedVal}T00:00:00${tz}`;
        const nextDay = new Date(localMidnight);
        nextDay.setDate(nextDay.getDate() + 1);
        const ny = nextDay.getFullYear();
        const nm = String(nextDay.getMonth() + 1).padStart(2, "0");
        const nd = String(nextDay.getDate()).padStart(2, "0");
        const dayEnd = `${ny}-${nm}-${nd}T00:00:00${getLocalTimezoneOffset(nextDay)}`;
        if (filter.operator === "eq") {
          params[`${filter.field}.gte`] = dayStart;
          params[`${filter.field}.lt`] = dayEnd;
        } else {
          params[`${filter.field}.lt`] = dayStart;
          params[`${filter.field}.gte`] = dayEnd;
        }
        continue;
      }
    }

    const key = `${filter.field}.${filter.operator}`;
    const value = normalizeFilterValue(
      filter.field,
      Array.isArray(rawValue) ? rawValue : (rawValue ?? ""),
      dateFields,
    );

    if (Array.isArray(value) && MULTI_VALUE_OPERATORS.has(filter.operator)) {
      params[key] = value;
    } else if (Array.isArray(value)) {
      params[key] = value.join(",");
    } else {
      params[key] = value;
    }
  }

  return params;
}
