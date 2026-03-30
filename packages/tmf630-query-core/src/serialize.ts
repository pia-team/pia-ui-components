/**
 * Serialize FilterCondition[] → TMF630 query params (field.operator=value).
 * Config-driven: uses FieldConfig[] for type-aware date formatting,
 * operator translation, and enum value mapping.
 */

import type { FilterCondition, FilterOperator, QueryParamValue } from "./types.js";
import type { FieldConfig, FieldConfigType } from "./config.js";
import { isTemporalType } from "./config.js";

const MULTI_VALUE_OPERATORS = new Set<FilterOperator>(["between", "in", "nin"]);
const NULL_CHECK_OPERATORS = new Set<FilterOperator>(["isnull", "isnotnull"]);

export interface SerializeFiltersOptions {
  fieldConfigs: FieldConfig[];
}

/* ================================================================ */
/*  Timezone helpers                                                 */
/* ================================================================ */

/**
 * Build the local timezone offset string (e.g. "+03:00", "-05:00", "Z").
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

/* ================================================================ */
/*  Date formatting per wire format                                  */
/* ================================================================ */

function parseDateParts(value: string): {
  date: string;
  hh: string;
  mm: string;
  ss: string;
} | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { date: trimmed, hh: "00", mm: "00", ss: "00" };
  }

  const dtMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[\sT](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (dtMatch) {
    return {
      date: dtMatch[1]!,
      hh: dtMatch[2]!,
      mm: dtMatch[3]!,
      ss: dtMatch[4] ?? "00",
    };
  }

  return null;
}

/**
 * Format a date/datetime value for the wire according to the backend's Java type.
 *
 * - `date`           → `yyyy-MM-dd`
 * - `dateTime`       → `yyyy-MM-dd'T'HH:mm:ss`
 * - `offsetDateTime` → `yyyy-MM-dd'T'HH:mm:ss+03:00`
 * - `instant`        → `yyyy-MM-dd'T'HH:mm:ssZ` (UTC)
 */
export function formatDateValue(
  value: string,
  type: FieldConfigType,
): string {
  if (!value) return "";
  const parts = parseDateParts(value);
  if (!parts) return value;

  const { date, hh, mm, ss } = parts;
  const localIso = `${date}T${hh}:${mm}:${ss}`;

  switch (type) {
    case "date":
      return date;

    case "dateTime":
      return localIso;

    case "offsetDateTime": {
      const tz = getLocalTimezoneOffset(new Date(localIso));
      return `${localIso}${tz}`;
    }

    case "instant": {
      const localDate = new Date(localIso);
      if (Number.isNaN(localDate.getTime())) return value;
      return localDate.toISOString().replace(/\.\d{3}Z$/, "Z");
    }

    default:
      return value;
  }
}

/* ================================================================ */
/*  Legacy date helpers (kept for backward compat of display utils)  */
/* ================================================================ */

/**
 * Normalize a date/datetime string to full ISO-8601 with local timezone.
 * @deprecated Use formatDateValue() with a FieldConfigType instead.
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

/** Normalize a date string to YYYY-MM-DD for display only. */
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

/** Normalize a date/time string to YYYY-MM-DD HH:mm for display. */
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

/* ================================================================ */
/*  Operator translation (date displayFormat → wire operators)       */
/* ================================================================ */

interface TranslatedParam {
  key: string;
  value: QueryParamValue;
}

function computeNextDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayBoundary(dateStr: string, fieldType: FieldConfigType): string {
  return formatDateValue(`${dateStr} 00:00:00`, fieldType);
}

function nextDayBoundary(dateStr: string, fieldType: FieldConfigType): string {
  const next = computeNextDay(dateStr);
  return formatDateValue(`${next} 00:00:00`, fieldType);
}

/**
 * Translate a date filter when displayFormat="date" but the backend
 * stores timestamps. Returns translated param(s) or null if no
 * translation needed.
 */
function translateDateFilter(
  field: FieldConfig,
  filter: FilterCondition,
): TranslatedParam[] | null {
  if (!field.displayFormat || field.displayFormat !== "date") return null;
  if (field.type === "date") return null;
  if (!isTemporalType(field.type)) return null;

  const rawValue = filter.value;
  if (typeof rawValue !== "string") return null;

  const trimmed = rawValue.trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  if (!isDateOnly) return null;

  const fieldName = filter.field;
  const type = field.type;
  const start = dayBoundary(trimmed, type);
  const nextStart = nextDayBoundary(trimmed, type);

  switch (filter.operator) {
    case "eq":
      return [
        { key: `${fieldName}.gte`, value: start },
        { key: `${fieldName}.lt`, value: nextStart },
      ];
    case "ne":
      return [
        { key: `${fieldName}.lt`, value: start },
        { key: `${fieldName}.gte`, value: nextStart },
      ];
    case "gt":
      return [{ key: `${fieldName}.gte`, value: nextStart }];
    case "gte":
      return [{ key: `${fieldName}.gte`, value: start }];
    case "lt":
      return [{ key: `${fieldName}.lt`, value: start }];
    case "lte":
      return [{ key: `${fieldName}.lt`, value: nextStart }];
    default:
      return null;
  }
}

/**
 * Translate a "between" filter for date displayFormat="date" with
 * timestamp backend.
 */
function translateDateBetween(
  field: FieldConfig,
  filter: FilterCondition,
): TranslatedParam[] | null {
  if (!field.displayFormat || field.displayFormat !== "date") return null;
  if (field.type === "date") return null;
  if (!isTemporalType(field.type)) return null;
  if (filter.operator !== "between") return null;

  const rawValue = filter.value;
  if (!Array.isArray(rawValue) || rawValue.length < 2) return null;

  const startDate = rawValue[0]!.trim();
  const endDate = rawValue[1]!.trim();
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    return null;
  }

  const type = field.type;
  return [
    { key: `${filter.field}.gte`, value: dayBoundary(startDate, type) },
    { key: `${filter.field}.lt`, value: nextDayBoundary(endDate, type) },
  ];
}

/* ================================================================ */
/*  Enum value mapping                                               */
/* ================================================================ */

function mapEnumValue(
  field: FieldConfig,
  value: string,
): string {
  if (!field.values || field.values.length === 0) return value;
  const match = field.values.find(
    (v) => v.displayName === value || v.serverValue === value,
  );
  return match ? match.serverValue : value;
}

function mapFilterValue(
  field: FieldConfig | undefined,
  value: string | string[],
): string | string[] {
  if (!field) return value;

  if (field.type === "enum") {
    if (Array.isArray(value)) {
      return value.map((v) => mapEnumValue(field, v));
    }
    return mapEnumValue(field, value);
  }

  if (isTemporalType(field.type)) {
    if (Array.isArray(value)) {
      return value.map((v) => formatDateValue(v, field.type));
    }
    return formatDateValue(value, field.type);
  }

  return value;
}

/* ================================================================ */
/*  Main serializer                                                  */
/* ================================================================ */

/**
 * Serialize filters to query parameter record.
 * Uses FieldConfig[] for type-aware formatting, operator translation,
 * and enum value mapping.
 */
export function serializeFilters(
  filters: FilterCondition[],
  options: SerializeFiltersOptions,
): Record<string, QueryParamValue> {
  const configMap = new Map<string, FieldConfig>();
  for (const fc of options.fieldConfigs) {
    configMap.set(fc.name, fc);
  }

  const params: Record<string, QueryParamValue> = {};

  for (const filter of filters) {
    if (!filter.field) continue;

    const fieldConfig = configMap.get(filter.field);

    if (NULL_CHECK_OPERATORS.has(filter.operator)) {
      params[`${filter.field}.${filter.operator}`] = "true";
      continue;
    }

    const rawValue = filter.value;
    const isEmpty = Array.isArray(rawValue)
      ? rawValue.every((v) => String(v).trim() === "")
      : String(rawValue ?? "").trim() === "";
    if (isEmpty) continue;

    if (fieldConfig) {
      if (filter.operator === "between") {
        const translated = translateDateBetween(fieldConfig, filter);
        if (translated) {
          for (const t of translated) {
            params[t.key] = t.value;
          }
          continue;
        }
      } else {
        const translated = translateDateFilter(fieldConfig, filter);
        if (translated) {
          for (const t of translated) {
            params[t.key] = t.value;
          }
          continue;
        }
      }
    }

    const key = `${filter.field}.${filter.operator}`;
    const value = mapFilterValue(
      fieldConfig,
      Array.isArray(rawValue) ? rawValue : (rawValue ?? ""),
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
