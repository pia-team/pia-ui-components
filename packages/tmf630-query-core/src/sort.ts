/**
 * TMF630 Sort Serialization
 *
 * TMF630 convention:
 *   "-field"  → descending
 *   "+field"  or "field" → ascending
 *   Multiple fields separated by comma.
 */

import type { SortState } from "./types.js";

/**
 * Serialize a SortState to the TMF630 sort query parameter string.
 *
 * @example
 *   serializeSort({ field: "createdOn", direction: "desc" }) // "-createdOn"
 *   serializeSort({ field: "name", direction: "asc" })       // "name"
 *   serializeSort(null)                                       // undefined
 */
export function serializeSort(sort: SortState | null): string | undefined {
  if (!sort) return undefined;
  return sort.direction === "desc" ? `-${sort.field}` : sort.field;
}

/**
 * Deserialize a TMF630 sort query parameter string back to SortState.
 *
 * @example
 *   deserializeSort("-createdOn") // { field: "createdOn", direction: "desc" }
 *   deserializeSort("name")      // { field: "name", direction: "asc" }
 *   deserializeSort(null)         // null
 */
export function deserializeSort(sortParam: string | null): SortState | null {
  if (!sortParam) return null;

  if (sortParam.startsWith("-")) {
    return { field: sortParam.slice(1), direction: "desc" };
  }

  if (sortParam.startsWith("+")) {
    return { field: sortParam.slice(1), direction: "asc" };
  }

  return { field: sortParam, direction: "asc" };
}

/**
 * Three-way sort toggle: no sort → asc → desc → no sort.
 *
 * If the field changes, starts fresh at "asc".
 */
export function toggleSort(
  currentSort: SortState | null,
  field: string,
): SortState | null {
  if (!currentSort || currentSort.field !== field) {
    return { field, direction: "asc" };
  }

  if (currentSort.direction === "asc") {
    return { field, direction: "desc" };
  }

  return null;
}
