/**
 * Deserialize query parameter record → FilterCondition[].
 * Used when restoring filter state from URL search params.
 */

import type { FilterCondition, FilterOperator } from "./types.js";

// Captures everything before the last dot as field path (supports nested: address.city.eq)
const FILTER_KEY_REGEX =
  /^(.+)\.(eq|ne|eqi|nei|gt|gte|lt|lte|between|in|nin|isnull|isnotnull|like|likei|contains|containsi|startswith|startswithi|endswith|endswithi|regex|regexi)$/;

const MULTI_VALUE_OPS = ["between", "in", "nin"];

export function deserializeFilters(
  params: Record<string, string | string[]>,
): FilterCondition[] {
  const filters: FilterCondition[] = [];

  for (const [key, value] of Object.entries(params)) {
    const match = key.match(FILTER_KEY_REGEX);
    if (!match) continue;

    const field = match[1]!;
    const operator = match[2]! as FilterOperator;

    if (operator === "isnull" || operator === "isnotnull") {
      filters.push({ field, operator, value: "" });
      continue;
    }

    const filterValue = MULTI_VALUE_OPS.includes(operator)
      ? Array.isArray(value)
        ? value
        : typeof value === "string"
          ? value.split(",").map((s) => s.trim())
          : []
      : typeof value === "string"
        ? value
        : Array.isArray(value)
          ? value[0] ?? ""
          : "";

    filters.push({ field, operator, value: filterValue });
  }

  return filters;
}
