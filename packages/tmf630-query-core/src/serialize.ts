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
 * Normalize a date string to full ISO-8601 with timezone for the API.
 * If the input is date-only (YYYY-MM-DD), appends T00:00:00Z.
 */
export function normalizeDateToISO(value: string): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00Z`;
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
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
      typeof rawValue === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(rawValue.trim())
    ) {
      const dayStart = `${rawValue.trim()}T00:00:00Z`;
      const nextDay = new Date(dayStart);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      const dayEnd = nextDay.toISOString().replace(/\.\d{3}Z$/, "Z");
      if (filter.operator === "eq") {
        params[`${filter.field}.gte`] = dayStart;
        params[`${filter.field}.lt`] = dayEnd;
      } else {
        params[`${filter.field}.lt`] = dayStart;
        params[`${filter.field}.gte`] = dayEnd;
      }
      continue;
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
